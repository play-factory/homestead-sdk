import type { ApiClientError } from "@homestead/sdk";

import type { CliConfig } from "./config.js";
import type { CliError } from "./errors.js";
import { buildNetworkError } from "./network-errors.js";

const insertByDescendingLength = (
	accumulator: readonly string[],
	secret: string,
): readonly string[] => {
	const index = accumulator.findIndex((value) => value.length < secret.length);
	return index === -1
		? [...accumulator, secret]
		: [...accumulator.slice(0, index), secret, ...accumulator.slice(index)];
};

const normalizedSecrets = (
	secrets: readonly (string | null | undefined)[],
): readonly string[] =>
	secrets
		.filter(
			(secret): secret is string =>
				secret !== undefined && secret !== null && secret.length > 0,
		)
		.reduce<readonly string[]>(insertByDescendingLength, []);

export const redactSecrets = (
	message: string,
	secrets: readonly (string | null | undefined)[],
): string =>
	normalizedSecrets(secrets).reduce<string>(
		(redacted, secret) => redacted.split(secret).join("[redacted]"),
		message,
	);

export const mapApiClientError = (
	apiError: ApiClientError,
	secrets: readonly (string | null | undefined)[],
	networkContext: {
		readonly command: string;
		readonly config: CliConfig;
	},
): CliError => {
	switch (apiError.type) {
		case "configuration_error":
			return {
				type: "config_error",
				message: redactSecrets(apiError.message, secrets),
			};
		case "transport_error":
			return buildNetworkError({
				command: networkContext.command,
				apiBaseUrl: networkContext.config.apiBaseUrl,
				apiBaseUrlSource: networkContext.config.apiBaseUrlSource,
				causeMessage: apiError.message,
				secrets,
			});
		case "contract_error":
			return {
				type: "contract_error",
				message: redactSecrets(apiError.message, secrets),
			};
		case "api_error": {
			const message = redactSecrets(apiError.message, secrets);
			return apiError.requestId === undefined
				? { type: "api_error", status: apiError.status, message }
				: {
						type: "api_error",
						status: apiError.status,
						message,
						requestId: apiError.requestId,
					};
		}
	}
};
