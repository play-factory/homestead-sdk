import { describe, expect, it } from "vitest";

import {
	buildNetworkError,
	classifyNetworkFailure,
	sanitizeUrlForDisplay,
} from "../src/core/network-errors.js";

describe("CLI network errors", () => {
	it("classifies common network failures", () => {
		expect.hasAssertions();

		expect(classifyNetworkFailure("connect ECONNREFUSED 127.0.0.1:8787")).toBe(
			"connection_refused",
		);
		expect(
			classifyNetworkFailure("getaddrinfo ENOTFOUND api.example.invalid"),
		).toBe("dns_failure");
		expect(classifyNetworkFailure("UND_ERR_CONNECT_TIMEOUT")).toBe("timeout");
		expect(
			classifyNetworkFailure("SELF_SIGNED_CERT_IN_CHAIN certificate"),
		).toBe("tls_failure");
		expect(classifyNetworkFailure("fetch failed")).toBe("fetch_failed");
	});

	it("sanitizes URL credentials, query strings, and fragments", () => {
		expect.hasAssertions();

		expect(
			sanitizeUrlForDisplay(
				"https://user:pass@example.com/path?token=secret#hash",
			),
		).toBe("https://example.com/path");
	});

	it("builds actionable default-production guidance without leaking secrets", () => {
		expect.hasAssertions();

		const error = buildNetworkError({
			command: "health",
			apiBaseUrl: "https://api.homestead.work?token=url-secret",
			apiBaseUrlSource: "default",
			causeMessage: "fetch failed for bearer-secret",
			secrets: ["bearer-secret", "url-secret"],
		});

		expect(error).toMatchObject({
			type: "network_error",
			message: 'Unable to reach Homestead API while running "health".',
			apiBaseUrl: "https://api.homestead.work",
			apiBaseUrlSource: "default",
			apiBaseUrlSourceLabel: "default production URL",
			causeMessage: "fetch failed for [redacted]",
		});
		if (error.type !== "network_error")
			throw new Error("expected network error");
		expect(error.suggestions.join("\n")).toContain("--base-url");
		expect(error.suggestions.join("\n")).not.toContain("pnpm dev");
		expect(JSON.stringify(error)).not.toContain("bearer-secret");
		expect(JSON.stringify(error)).not.toContain("url-secret");
	});

	it("builds public-safe local API guidance", () => {
		expect.hasAssertions();

		const error = buildNetworkError({
			command: "health",
			apiBaseUrl: "http://localhost:8787",
			apiBaseUrlSource: "flag",
			causeMessage: "connect ECONNREFUSED 127.0.0.1:8787",
			secrets: [],
		});

		if (error.type !== "network_error")
			throw new Error("expected network error");
		expect(error.suggestions).toContain(
			"Start the local Homestead API server, or pass --base-url for the API you want to use.",
		);
		expect(error.suggestions.join("\n")).toContain("production API");
		expect(error.suggestions.join("\n")).not.toContain("pnpm dev");
	});
});
