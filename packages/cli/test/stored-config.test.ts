import { describe, expect, it } from "vitest";

import {
	parseStoredConfig,
	serializeStoredConfig,
} from "../src/core/stored-config.js";

describe("stored CLI config", () => {
	it("serializes and parses versioned config", () => {
		expect.hasAssertions();
		const content = serializeStoredConfig({
			version: 1,
			apiBaseUrl: "https://api.example.com",
			token: "secret-token",
		});
		expect(parseStoredConfig(content)).toStrictEqual({
			status: "ok",
			value: {
				version: 1,
				apiBaseUrl: "https://api.example.com",
				token: "secret-token",
			},
		});
	});

	it("rejects invalid config without echoing token-like content", () => {
		expect.hasAssertions();
		expect(
			parseStoredConfig('{"version":1,"token":"secret-token"}'),
		).toStrictEqual({
			status: "error",
			error: {
				type: "config_error",
				message: "Stored Homestead CLI config is invalid.",
			},
		});
	});
});
