import {
	createHomesteadApiClient,
	type ApiClientError,
	type FetchLike,
} from "@homestead/sdk";

import { executeCliApiOperation } from "../adapters/api-client-executor.js";
import { listSkills, loadSkill } from "../adapters/skill-loader.js";
import { redactSecrets } from "../core/api-client-error.js";
import { planCliApiOperation } from "../core/api-client-command.js";
import { cliCommandName } from "../core/command-metadata.js";
import type { CliCommand } from "../core/commands.js";
import { commandRequiresAuth } from "../core/commands.js";
import {
	emptyToUndefined,
	resolveCliConfig,
	type OutputFormat,
} from "../core/config.js";
import { exitCodeForError, type CliError } from "../core/errors.js";
import { renderError, renderSuccess } from "../core/render.js";
import type { Result } from "../core/result.js";
import type { StoredCliConfig } from "../core/stored-config.js";
import { parseCli } from "./parser.js";

export type ConfigStore = {
	readonly path: string;
	readonly read: () => Promise<
		| { readonly status: "missing" }
		| { readonly status: "loaded"; readonly config: StoredCliConfig }
		| { readonly status: "invalid"; readonly error: CliError }
	>;
	readonly write: (config: StoredCliConfig) => Promise<Result<void, CliError>>;
	readonly clear: () => Promise<Result<void, CliError>>;
};

export type CliRuntime = {
	readonly args: readonly string[];
	readonly env: Readonly<Record<string, string | undefined>>;
	readonly fetch?: FetchLike;
	readonly stdout: { readonly write: (text: string) => void };
	readonly stderr: { readonly write: (text: string) => void };
	readonly configStore?: ConfigStore;
	readonly stdin?: { readonly read: () => Promise<string> };
	readonly openUrl?: (url: string) => Promise<Result<void, CliError>>;
	readonly sleep?: (milliseconds: number) => Promise<void>;
};

export type CliRunResult = { readonly exitCode: 0 | 1 | 2 | 3 };

const missingConfigStore: ConfigStore = {
	path: "",
	read: async () => ({ status: "missing" }),
	write: async () => ({
		status: "error",
		error: {
			type: "config_error",
			message: "Config store is not available.",
		},
	}),
	clear: async () => ({
		status: "error",
		error: {
			type: "config_error",
			message: "Config store is not available.",
		},
	}),
};

type StoredConfigRead = Awaited<ReturnType<ConfigStore["read"]>>;

const readTokenFromStdin = async (
	runtime: CliRuntime,
): Promise<string | null> => {
	if (runtime.stdin === undefined) {
		return null;
	}
	return emptyToUndefined(await runtime.stdin.read()) ?? null;
};

const explicitToken = (
	runtime: CliRuntime,
	flags: { readonly token?: string },
	loginToken: string | null,
): string | null =>
	loginToken ??
	emptyToUndefined(flags.token) ??
	emptyToUndefined(runtime.env["HOMESTEAD_API_TOKEN"]) ??
	null;

const mayIgnoreInvalidStoredConfig = (
	runtime: CliRuntime,
	flags: { readonly token?: string },
	commandRequiresToken: boolean,
	loginToken: string | null,
): boolean =>
	!commandRequiresToken || explicitToken(runtime, flags, loginToken) !== null;

const requestedOutputFormat = (
	args: readonly string[],
	env: Readonly<Record<string, string | undefined>>,
): OutputFormat =>
	env["HOMESTEAD_JSON"] === "1" ||
	args.includes("--json") ||
	args.some((arg, index) =>
		arg === "--format" ? args[index + 1] === "json" : arg === "--format=json",
	)
		? "json"
		: "table";

const readStoredConfig = async (
	configStore: ConfigStore,
): Promise<StoredConfigRead> => {
	try {
		return await configStore.read();
	} catch {
		return {
			status: "invalid",
			error: {
				type: "config_error",
				message: "Unable to read stored Homestead CLI config.",
			},
		};
	}
};

const isDeviceLoginSlowDown = (error: ApiClientError): boolean =>
	error.type === "api_error" && error.code === "slow_down";

const runDeviceLogin = async ({
	runtime,
	configStore,
	apiBaseUrl,
	outputFormat,
	commandName,
}: {
	readonly runtime: CliRuntime;
	readonly configStore: ConfigStore;
	readonly apiBaseUrl: string;
	readonly outputFormat: OutputFormat;
	readonly commandName: ReturnType<typeof cliCommandName>;
}): Promise<CliRunResult> => {
	const client = createHomesteadApiClient({
		baseUrl: apiBaseUrl,
		auth: { type: "anonymous" },
		...(runtime.fetch === undefined ? {} : { fetch: runtime.fetch }),
	});
	const started = await client.startDeviceLogin({
		clientName: "Homestead CLI",
		clientType: "cli",
		requestedScopes: ["cli:standard"],
		expiresInDays: 90,
	});
	if (started.status === "error") {
		runtime.stderr.write(
			renderError(
				{ type: "contract_error", message: started.error.message },
				outputFormat,
				commandName,
			),
		);
		return { exitCode: 1 };
	}

	runtime.stdout.write(`Open ${started.value.data.verificationUriComplete}\n`);
	const openResult = await (runtime.openUrl?.(
		started.value.data.verificationUriComplete,
	) ?? Promise.resolve({ status: "ok" as const, value: undefined }));
	if (openResult.status === "error") {
		runtime.stderr.write(
			`Warning: ${openResult.error.message}\nOpen the URL above manually to approve this login.\n`,
		);
	}
	runtime.stdout.write("Waiting for approval...\n");

	const sleep =
		runtime.sleep ??
		((milliseconds: number) =>
			new Promise<void>((resolve) => setTimeout(resolve, milliseconds)));
	const deadline = Date.now() + started.value.data.expiresIn * 1000;
	const pollUntilApproved = async (
		intervalSeconds: number,
	): Promise<CliRunResult | null> => {
		if (Date.now() > deadline) return null;
		const polled = await client.pollDeviceLoginToken({
			deviceCode: started.value.data.deviceCode,
		});
		if (polled.status === "error") {
			if (isDeviceLoginSlowDown(polled.error)) {
				await sleep(intervalSeconds * 1000);
				return pollUntilApproved(intervalSeconds);
			}
			runtime.stderr.write(
				renderError(
					{ type: "contract_error", message: polled.error.message },
					outputFormat,
					commandName,
				),
			);
			return { exitCode: 1 };
		}
		if (polled.value.data.status === "approved") {
			const writeResult = await configStore.write({
				version: 1,
				apiBaseUrl,
				token: polled.value.data.accessToken,
				tokenExpiresAt: polled.value.data.expiresAt,
				scopes: polled.value.data.scopes,
			});
			if (writeResult.status === "error") {
				runtime.stderr.write(
					renderError(writeResult.error, outputFormat, commandName),
				);
				return { exitCode: exitCodeForError(writeResult.error) };
			}
			runtime.stdout.write("Logged in with device approval.\n");
			return { exitCode: 0 };
		}
		await sleep(polled.value.data.interval * 1000);
		return pollUntilApproved(polled.value.data.interval);
	};
	const approvalResult = await pollUntilApproved(started.value.data.interval);
	if (approvalResult !== null) return approvalResult;
	const error = {
		type: "authentication_config_error" as const,
		message: "Device login expired before approval.",
	};
	runtime.stderr.write(renderError(error, outputFormat, commandName));
	return { exitCode: exitCodeForError(error) };
};

export const runCli = async (runtime: CliRuntime): Promise<CliRunResult> => {
	const initialFormat = requestedOutputFormat(runtime.args, runtime.env);
	const parsed = parseCli(runtime.args);
	if (parsed.status === "error") {
		runtime.stderr.write(renderError(parsed.error, initialFormat));
		return { exitCode: exitCodeForError(parsed.error) };
	}
	if ("helpText" in parsed.value) {
		runtime.stdout.write(parsed.value.helpText);
		return { exitCode: 0 };
	}
	const configStore = runtime.configStore ?? missingConfigStore;
	const command = parsed.value.command;
	const commandName = cliCommandName(command);
	if (command.kind === "skill_list") {
		runtime.stdout.write(
			renderSuccess(listSkills(), initialFormat, commandName),
		);
		return { exitCode: 0 };
	}
	if (command.kind === "skill") {
		const skill = await loadSkill(command.name);
		if (skill.status === "error") {
			runtime.stderr.write(
				renderError(skill.error, initialFormat, commandName),
			);
			return { exitCode: exitCodeForError(skill.error) };
		}
		runtime.stdout.write(
			renderSuccess(skill.value, initialFormat, commandName),
		);
		return { exitCode: 0 };
	}
	let loginToken: string | null = null;
	let setupToken: string | null = null;
	try {
		loginToken =
			command.kind === "login" && command.tokenFromStdin
				? await readTokenFromStdin(runtime)
				: null;
	} catch {
		const error = {
			type: "authentication_config_error" as const,
			message: "Unable to read token from stdin.",
		};
		runtime.stderr.write(renderError(error, initialFormat, commandName));
		return { exitCode: exitCodeForError(error) };
	}
	const stored = await readStoredConfig(configStore);
	if (
		stored.status === "invalid" &&
		!mayIgnoreInvalidStoredConfig(
			runtime,
			parsed.value.flags,
			commandRequiresAuth(command),
			loginToken,
		)
	) {
		runtime.stderr.write(renderError(stored.error, initialFormat, commandName));
		return { exitCode: exitCodeForError(stored.error) };
	}
	if (
		command.kind === "login" &&
		command.tokenFromStdin &&
		loginToken === null
	) {
		const error = {
			type: "authentication_config_error" as const,
			message: "--token-stdin requires a token on stdin.",
		};
		runtime.stderr.write(renderError(error, initialFormat, commandName));
		return { exitCode: exitCodeForError(error) };
	}
	let commandWithStdinToken: CliCommand = command;
	try {
		if (command.kind === "register" && command.setupTokenFromStdin) {
			setupToken = await readTokenFromStdin(runtime);
			if (setupToken !== null) {
				commandWithStdinToken = { ...command, setupToken };
			}
		}
	} catch {
		const error = {
			type: "authentication_config_error" as const,
			message: "Unable to read setup token from stdin.",
		};
		runtime.stderr.write(renderError(error, initialFormat, commandName));
		return { exitCode: exitCodeForError(error) };
	}
	if (
		command.kind === "register" &&
		command.setupTokenFromStdin &&
		commandWithStdinToken.kind === "register" &&
		commandWithStdinToken.setupToken === undefined
	) {
		const error = {
			type: "authentication_config_error" as const,
			message: "--setup-token-stdin requires a setup token on stdin.",
		};
		runtime.stderr.write(renderError(error, initialFormat, commandName));
		return { exitCode: exitCodeForError(error) };
	}
	const config = resolveCliConfig({
		env: runtime.env,
		flags:
			loginToken === null
				? parsed.value.flags
				: { ...parsed.value.flags, token: loginToken },
		storedConfig: stored.status === "loaded" ? stored.config : null,
	});
	if (config.status === "error") {
		runtime.stderr.write(renderError(config.error, initialFormat, commandName));
		return { exitCode: exitCodeForError(config.error) };
	}
	if (command.kind === "login" && config.value.token === null) {
		return runDeviceLogin({
			runtime,
			configStore,
			apiBaseUrl: config.value.apiBaseUrl,
			outputFormat: config.value.outputFormat,
			commandName,
		});
	}
	let mintedToken: string | null = null;
	const operation = planCliApiOperation(commandWithStdinToken, config.value);
	if (operation.status === "error") {
		runtime.stderr.write(
			renderError(operation.error, config.value.outputFormat, commandName),
		);
		return { exitCode: exitCodeForError(operation.error) };
	}
	try {
		const apiResult = await executeCliApiOperation({
			operation: operation.value,
			config: config.value,
			...(runtime.fetch === undefined ? {} : { fetch: runtime.fetch }),
			secrets: [config.value.token, setupToken],
		});
		if (apiResult.status === "error") {
			runtime.stderr.write(
				renderError(apiResult.error, config.value.outputFormat, commandName),
			);
			return { exitCode: exitCodeForError(apiResult.error) };
		}
		if (apiResult.value.kind === "register") {
			mintedToken = apiResult.value.data.token;
			const writeResult = await configStore.write({
				version: 1,
				apiBaseUrl: config.value.apiBaseUrl,
				token: apiResult.value.data.token,
			});
			if (writeResult.status === "error") {
				runtime.stderr.write(
					renderError(
						writeResult.error,
						config.value.outputFormat,
						commandName,
					),
				);
				return { exitCode: exitCodeForError(writeResult.error) };
			}
		}
		if (apiResult.value.kind === "rotate_token") {
			mintedToken = apiResult.value.data.token;
			const writeResult = await configStore.write({
				version: 1,
				apiBaseUrl: config.value.apiBaseUrl,
				token: apiResult.value.data.token,
			});
			if (writeResult.status === "error") {
				runtime.stderr.write(
					renderError(
						writeResult.error,
						config.value.outputFormat,
						commandName,
					),
				);
				return { exitCode: exitCodeForError(writeResult.error) };
			}
		}
		if (apiResult.value.kind === "revoke_token") {
			const clearResult = await configStore.clear();
			if (clearResult.status === "error") {
				runtime.stderr.write(
					renderError(
						clearResult.error,
						config.value.outputFormat,
						commandName,
					),
				);
				return { exitCode: exitCodeForError(clearResult.error) };
			}
		}
		if (command.kind === "login") {
			if (config.value.token === null) {
				const error = {
					type: "authentication_config_error" as const,
					message:
						"Login requires HOMESTEAD_API_TOKEN, --token, or --token-stdin.",
				};
				runtime.stderr.write(
					renderError(error, config.value.outputFormat, commandName),
				);
				return { exitCode: exitCodeForError(error) };
			}
			const writeResult = await configStore.write({
				version: 1,
				apiBaseUrl: config.value.apiBaseUrl,
				token: config.value.token,
			});
			if (writeResult.status === "error") {
				runtime.stderr.write(
					renderError(
						writeResult.error,
						config.value.outputFormat,
						commandName,
					),
				);
				return { exitCode: exitCodeForError(writeResult.error) };
			}
		}
		runtime.stdout.write(
			renderSuccess(apiResult.value, config.value.outputFormat, commandName),
		);
		return { exitCode: 0 };
	} catch (caught) {
		const rawMessage =
			caught instanceof Error ? caught.message : "Unexpected CLI failure.";
		const redactedMessage = redactSecrets(rawMessage, [
			config.value.token,
			setupToken,
			mintedToken,
		]);
		const error = {
			type: "contract_error" as const,
			message: `Unexpected CLI error while running "${operation.value.kind}": ${redactedMessage}`,
		};
		runtime.stderr.write(
			renderError(error, config.value.outputFormat, commandName),
		);
		return { exitCode: exitCodeForError(error) };
	}
};
