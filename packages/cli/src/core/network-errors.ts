import type { ApiBaseUrlSource } from "./config.js";
import type { CliError } from "./errors.js";

export type NetworkFailureKind =
	| "connection_refused"
	| "dns_failure"
	| "timeout"
	| "tls_failure"
	| "fetch_failed"
	| "unknown";

export type BuildNetworkErrorInput = {
	readonly command: string;
	readonly apiBaseUrl: string;
	readonly apiBaseUrlSource: ApiBaseUrlSource;
	readonly causeMessage: string;
	readonly secrets: readonly (string | null | undefined)[];
};

const remoteWorkerUrl = "https://api.homestead.work";

const normalizedSecrets = (
	secrets: readonly (string | null | undefined)[],
): readonly string[] =>
	secrets.filter(
		(secret): secret is string =>
			secret !== undefined && secret !== null && secret.length > 0,
	);

const redactSecrets = (
	message: string,
	secrets: readonly (string | null | undefined)[],
): string =>
	normalizedSecrets(secrets).reduce(
		(redacted, secret) => redacted.split(secret).join("[redacted]"),
		message,
	);

export const sanitizeUrlForDisplay = (value: string): string => {
	try {
		const url = new URL(value);
		url.username = "";
		url.password = "";
		url.search = "";
		url.hash = "";
		return url.toString().replace(/\/$/u, "");
	} catch {
		return "[invalid URL]";
	}
};

export const classifyNetworkFailure = (message: string): NetworkFailureKind => {
	const lower = message.toLowerCase();
	if (lower.includes("econnrefused") || lower.includes("connection refused")) {
		return "connection_refused";
	}
	if (
		lower.includes("enotfound") ||
		lower.includes("getaddrinfo") ||
		lower.includes("name or service not known")
	) {
		return "dns_failure";
	}
	if (
		lower.includes("timeout") ||
		lower.includes("etimedout") ||
		lower.includes("und_err_connect_timeout")
	) {
		return "timeout";
	}
	if (
		lower.includes("certificate") ||
		lower.includes("tls") ||
		lower.includes("ssl") ||
		lower.includes("self_signed_cert")
	) {
		return "tls_failure";
	}
	if (lower.includes("fetch failed")) {
		return "fetch_failed";
	}
	return "unknown";
};

const isLocalUrl = (value: string): boolean => {
	try {
		const hostname = new URL(value).hostname;
		return (
			hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1"
		);
	} catch {
		return false;
	}
};

const sourceLabel = (source: ApiBaseUrlSource): string => {
	switch (source) {
		case "flag":
			return "--base-url flag";
		case "env":
			return "HOMESTEAD_API_BASE_URL environment variable";
		case "stored_config":
			return "stored CLI login";
		case "default":
			return "default production URL";
	}
};

const suggestionsFor = (input: BuildNetworkErrorInput): readonly string[] => {
	const local = isLocalUrl(input.apiBaseUrl);
	return [
		...(local
			? [
					"Start the local Homestead API server, or pass --base-url for the API you want to use.",
				]
			: []),
		`Point at the production API: --base-url ${remoteWorkerUrl}`,
		"Set HOMESTEAD_API_BASE_URL or run `homestead login --base-url <url>` to save the intended API URL.",
		"Check that the API URL is reachable from this machine and that your network/VPN is connected.",
	];
};

export const buildNetworkError = (input: BuildNetworkErrorInput): CliError => {
	const causeMessage = redactSecrets(input.causeMessage, input.secrets);
	return {
		type: "network_error",
		message: `Unable to reach Homestead API while running "${input.command}".`,
		command: input.command,
		apiBaseUrl: sanitizeUrlForDisplay(input.apiBaseUrl),
		apiBaseUrlSource: input.apiBaseUrlSource,
		apiBaseUrlSourceLabel: sourceLabel(input.apiBaseUrlSource),
		failureKind: classifyNetworkFailure(causeMessage),
		causeMessage,
		suggestions: suggestionsFor(input),
	};
};
