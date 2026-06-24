import { describe, expect, it } from "vitest";

import { resolveCliConfig } from "../src/core/config.js";

describe("CLI config", () => {
	it("uses defaults when env and flags are absent", () => {
		expect.hasAssertions();
		expect(resolveCliConfig({ env: {}, flags: {} })).toStrictEqual({
			status: "ok",
			value: {
				apiBaseUrl: "https://api.homestead.work",
				apiBaseUrlSource: "default",
				token: null,
				outputFormat: "table",
			},
		});
	});

	it("lets flags override env", () => {
		expect.hasAssertions();
		expect(
			resolveCliConfig({
				env: {
					HOMESTEAD_API_BASE_URL: "https://env.example.com/",
					HOMESTEAD_API_TOKEN: "env-token",
				},
				flags: {
					baseUrl: "https://flag.example.com/",
					token: "flag-token",
					format: "json",
				},
			}),
		).toStrictEqual({
			status: "ok",
			value: {
				apiBaseUrl: "https://flag.example.com",
				apiBaseUrlSource: "flag",
				token: "flag-token",
				outputFormat: "json",
			},
		});
	});

	it("supports HOMESTEAD_JSON and --json output selection", () => {
		expect.hasAssertions();
		expect(
			resolveCliConfig({ env: { HOMESTEAD_JSON: "1" }, flags: {} }),
		).toMatchObject({
			status: "ok",
			value: { outputFormat: "json" },
		});
		expect(resolveCliConfig({ env: {}, flags: { json: true } })).toMatchObject({
			status: "ok",
			value: { outputFormat: "json" },
		});
	});

	it("uses stored config when flags and env are absent", () => {
		expect.hasAssertions();
		expect(
			resolveCliConfig({
				env: {},
				flags: {},
				storedConfig: {
					version: 1,
					apiBaseUrl: "https://stored.example.com/",
					token: "stored-token",
				},
			}),
		).toStrictEqual({
			status: "ok",
			value: {
				apiBaseUrl: "https://stored.example.com",
				apiBaseUrlSource: "stored_config",
				token: "stored-token",
				outputFormat: "table",
			},
		});
	});

	it("rejects invalid base URLs", () => {
		expect.hasAssertions();
		const result = resolveCliConfig({
			env: {},
			flags: { baseUrl: "not a url" },
		});
		expect(result).toStrictEqual({
			status: "error",
			error: {
				type: "config_error",
				message: "API base URL must be a valid URL.",
			},
		});
	});

	it("rejects invalid output formats", () => {
		expect.hasAssertions();
		const result = resolveCliConfig({ env: {}, flags: { format: "yaml" } });
		expect(result).toStrictEqual({
			status: "error",
			error: {
				type: "usage_error",
				message: "Output format must be json or table.",
			},
		});
	});
});
