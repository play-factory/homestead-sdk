import { describe, expect, it } from "vitest";

import {
	mapApiClientError,
	redactSecrets,
} from "../src/core/api-client-error.js";

const networkContext = {
	command: "health",
	config: {
		apiBaseUrl: "https://api.example.com",
		apiBaseUrlSource: "flag" as const,
		token: null,
		outputFormat: "table" as const,
	},
};

describe("API client error mapping", () => {
	it("redacts all in-flight secrets", () => {
		expect.hasAssertions();
		expect(
			redactSecrets("auth-token setup-token auth-token", [
				"auth-token",
				"setup-token",
			]),
		).toBe("[redacted] [redacted] [redacted]");
		expect(redactSecrets("abcd abc", ["abc", "abcd"])).toBe(
			"[redacted] [redacted]",
		);
	});

	it("maps SDK errors into CLI errors", () => {
		expect.hasAssertions();
		expect(
			mapApiClientError(
				{ type: "transport_error", message: "failed with secret" },
				["secret"],
				networkContext,
			),
		).toMatchObject({
			type: "network_error",
			message: 'Unable to reach Homestead API while running "health".',
			causeMessage: "failed with [redacted]",
		});
		expect(
			mapApiClientError(
				{ type: "configuration_error", message: "bad base" },
				[],
				networkContext,
			),
		).toStrictEqual({
			type: "config_error",
			message: "bad base",
		});
		expect(
			mapApiClientError(
				{ type: "contract_error", message: "bad shape" },
				[],
				networkContext,
			),
		).toStrictEqual({
			type: "contract_error",
			message: "bad shape",
		});
		expect(
			mapApiClientError(
				{ type: "api_error", status: 401, message: "nope", requestId: "req_1" },
				[],
				networkContext,
			),
		).toStrictEqual({
			type: "api_error",
			status: 401,
			message: "nope",
			requestId: "req_1",
		});
	});
});
