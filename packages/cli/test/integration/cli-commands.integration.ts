import { execFile } from "node:child_process";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

import { describe, expect, it } from "vitest";

import {
	assertNoSecretLeak,
	childEnvForIntegration,
	redactIntegrationSecrets,
	resolveCliIntegrationConfig,
	withTemporaryConfigPath,
	type CliIntegrationConfig,
	type CliProcessResult,
} from "./cli-integration-config.js";

const execFileAsync = promisify(execFile);
const cliEntryPoint = fileURLToPath(
	new URL("../../dist/bin/homestead.js", import.meta.url),
);
const config = resolveCliIntegrationConfig(process.env);

const secretsFor = (
	integrationConfig: CliIntegrationConfig,
): readonly string[] =>
	integrationConfig.token === undefined ? [] : [integrationConfig.token];

const runHomestead = async (
	args: readonly string[],
	integrationConfig: CliIntegrationConfig,
): Promise<CliProcessResult> =>
	withTemporaryConfigPath(async (configPath) => {
		try {
			const result = await execFileAsync("node", [cliEntryPoint, ...args], {
				env: childEnvForIntegration({ config: integrationConfig, configPath }),
				timeout: 15_000,
			});
			return {
				exitCode: 0,
				stdout: result.stdout,
				stderr: result.stderr,
			};
		} catch (caught) {
			if (caught instanceof Error && "stdout" in caught && "stderr" in caught) {
				return {
					exitCode:
						"code" in caught && typeof caught.code === "number"
							? caught.code
							: null,
					stdout: String(caught.stdout),
					stderr: String(caught.stderr),
				};
			}
			throw caught;
		}
	});

const expectCommand = async ({
	args,
	integrationConfig = config,
}: {
	readonly args: readonly string[];
	readonly integrationConfig?: CliIntegrationConfig;
}): Promise<CliProcessResult> => {
	const result = await runHomestead(args, integrationConfig);
	assertNoSecretLeak(result, secretsFor(integrationConfig));
	return result;
};

const describeAuthenticatedCommand =
	config.token === undefined ? describe.skip : describe;

describe("homestead CLI binary integration", () => {
	it("prints help without hitting the configured API", async () => {
		expect.hasAssertions();

		const result = await expectCommand({ args: [] });

		expect(result.exitCode).toBe(0);
		expect(result.stdout).toContain("Usage: homestead [options] [command]");
		expect(result.stdout).toContain("reminder-deliveries");
		expect(result.stderr).toBe("");
	});

	it("loads bundled skill content from the built CLI", async () => {
		expect.hasAssertions();

		const result = await expectCommand({
			args: ["skill", "homestead-cli", "--json"],
		});
		const output = JSON.parse(result.stdout) as {
			readonly ok: boolean;
			readonly command: string;
			readonly data: { readonly content: string };
		};

		expect(result.exitCode).toBe(0);
		expect(output.ok).toBe(true);
		expect(output.command).toBe("skill");
		expect(output.data.content).toContain("Homestead CLI guide for agents");
		expect(result.stderr).toBe("");
	});

	it("runs health against the configured server", async () => {
		expect.hasAssertions();

		const result = await expectCommand({
			args: ["health", "--base-url", config.baseUrl],
		});

		expect(result.exitCode).toBe(0);
		expect(result.stdout).toBe("ok\n");
		expect(result.stderr).toBe("");
	});

	it("runs health as stable JSON against the configured server", async () => {
		expect.hasAssertions();

		const result = await expectCommand({
			args: ["health", "--base-url", config.baseUrl, "--json"],
		});

		expect(result.exitCode).toBe(0);
		expect(JSON.parse(result.stdout) as unknown).toStrictEqual({
			ok: true,
			command: "health",
			data: { status: "ok" },
		});
		expect(result.stderr).toBe("");
	});

	it("fails authenticated commands safely when no token is supplied", async () => {
		expect.hasAssertions();
		const result = await expectCommand({
			args: ["homes", "--base-url", config.baseUrl],
			integrationConfig: {
				target: config.target,
				baseUrl: config.baseUrl,
				requireToken: false,
			},
		});

		expect(result.exitCode).toBe(3);
		expect(result.stdout).toBe("");
		expect(result.stderr).toContain("HOMESTEAD_API_TOKEN");
	});

	it("renders missing auth as stable JSON without hitting authenticated endpoints", async () => {
		expect.hasAssertions();
		const result = await expectCommand({
			args: ["homes", "--base-url", config.baseUrl, "--json"],
			integrationConfig: {
				target: config.target,
				baseUrl: config.baseUrl,
				requireToken: false,
			},
		});

		expect(result.exitCode).toBe(3);
		expect(result.stdout).toBe("");
		expect(JSON.parse(result.stderr) as unknown).toStrictEqual({
			ok: false,
			command: "homes",
			error: {
				code: "auth_required",
				message:
					"This command requires HOMESTEAD_API_TOKEN, stored login, or the --token flag.",
				details: {},
			},
		});
	});
});

describeAuthenticatedCommand(
	"homestead CLI authenticated binary integration",
	() => {
		it("runs me against the configured server using an env token", async () => {
			expect.hasAssertions();

			const result = await expectCommand({
				args: ["me", "--base-url", config.baseUrl],
			});

			expect(result.exitCode).toBe(0);
			expect(result.stdout.length).toBeGreaterThan(0);
			expect(result.stderr).toBe("");
			expect(redactIntegrationSecrets(result.stdout, secretsFor(config))).toBe(
				result.stdout,
			);
		});
	},
);
