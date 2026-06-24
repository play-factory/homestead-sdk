import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

export type CliIntegrationTarget = "local" | "remote";

export type CliIntegrationConfig = {
	readonly target: CliIntegrationTarget;
	readonly baseUrl: string;
	readonly token?: string;
	readonly requireToken: boolean;
};

export type CliProcessResult = {
	readonly exitCode: number | null;
	readonly stdout: string;
	readonly stderr: string;
};

const localDefaultBaseUrl = "http://localhost:8787";
const remoteDefaultBaseUrl = "https://api.homestead.work";

const parseTarget = (value: string | undefined): CliIntegrationTarget =>
	value === "remote" ? "remote" : "local";

const parseRequireToken = (value: string | undefined): boolean => {
	if (value === "1" || value === "true") return true;
	if (value === "0" || value === "false") return false;
	return false;
};

export const resolveCliIntegrationConfig = (
	env: Readonly<Record<string, string | undefined>>,
): CliIntegrationConfig => {
	const target = parseTarget(env["HOMESTEAD_CLI_INTEGRATION_TARGET"]);
	const baseUrl =
		env["HOMESTEAD_CLI_INTEGRATION_API_BASE_URL"] ??
		(target === "remote" ? remoteDefaultBaseUrl : localDefaultBaseUrl);
	const token = env["HOMESTEAD_CLI_INTEGRATION_API_TOKEN"]?.trim();
	return {
		target,
		baseUrl,
		requireToken: parseRequireToken(
			env["HOMESTEAD_CLI_INTEGRATION_REQUIRE_TOKEN"],
		),
		...(token === undefined || token.length === 0 ? {} : { token }),
	};
};

export const redactIntegrationSecrets = (
	text: string,
	secrets: readonly string[],
): string =>
	secrets.reduce(
		(redacted, secret) =>
			secret.length === 0
				? redacted
				: redacted.replaceAll(secret, "[redacted]"),
		text,
	);

export const assertNoSecretLeak = (
	result: Pick<CliProcessResult, "stdout" | "stderr">,
	secrets: readonly string[],
): void => {
	const combinedOutput = `${result.stdout}\n${result.stderr}`;
	if (
		secrets.some(
			(secret) => secret.length > 0 && combinedOutput.includes(secret),
		)
	) {
		throw new Error("CLI integration output leaked a configured secret.");
	}
};

export const withTemporaryConfigPath = async <T>(
	run: (configPath: string) => Promise<T>,
): Promise<T> => {
	const directory = await mkdtemp(join(tmpdir(), "homestead-cli-integration-"));
	try {
		return await run(join(directory, "config.json"));
	} finally {
		await rm(directory, { recursive: true, force: true });
	}
};

export const childEnvForIntegration = ({
	config,
	configPath,
}: {
	readonly config: CliIntegrationConfig;
	readonly configPath: string;
}): NodeJS.ProcessEnv => {
	const { HOMESTEAD_API_TOKEN: _homesteadApiToken, ...envWithoutDefaultToken } =
		process.env;
	return {
		...envWithoutDefaultToken,
		HOMESTEAD_CONFIG_PATH: configPath,
		...(config.token === undefined ? {} : { HOMESTEAD_API_TOKEN: config.token }),
	};
};
