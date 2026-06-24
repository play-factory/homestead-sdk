import type { CliError } from "./errors.js";
import { error, ok, type Result } from "./result.js";
import type { StoredCliConfig } from "./stored-config.js";

export type OutputFormat = "json" | "table";
export type ApiBaseUrlSource = "flag" | "env" | "stored_config" | "default";

export type CliConfig = {
	readonly apiBaseUrl: string;
	readonly apiBaseUrlSource: ApiBaseUrlSource;
	readonly token: string | null;
	readonly outputFormat: OutputFormat;
};

export type ConfigInput = {
	readonly env: Readonly<Record<string, string | undefined>>;
	readonly flags: {
		readonly baseUrl?: string;
		readonly token?: string;
		readonly format?: string;
		readonly json?: boolean;
	};
	readonly storedConfig?: StoredCliConfig | null;
};

const defaultApiBaseUrl = "https://api.homestead.work";

const resolveBaseUrlSource = ({
	flagBaseUrl,
	envBaseUrl,
	storedBaseUrl,
}: {
	readonly flagBaseUrl: string | undefined;
	readonly envBaseUrl: string | undefined;
	readonly storedBaseUrl: string | undefined;
}): ApiBaseUrlSource => {
	if (flagBaseUrl !== undefined) return "flag";
	if (envBaseUrl !== undefined) return "env";
	if (storedBaseUrl !== undefined) return "stored_config";
	return "default";
};

export const emptyToUndefined = (
	value: string | undefined,
): string | undefined => {
	const trimmed = value?.trim();
	return trimmed === undefined || trimmed.length === 0 ? undefined : trimmed;
};

export const normalizeBaseUrl = (value: string): Result<string, CliError> => {
	try {
		const url = new URL(value);
		if (url.protocol !== "http:" && url.protocol !== "https:") {
			return error({
				type: "config_error",
				message: "API base URL must use http or https.",
			});
		}
		return ok(url.toString().replace(/\/$/u, ""));
	} catch {
		return error({
			type: "config_error",
			message: "API base URL must be a valid URL.",
		});
	}
};

const parseOutputFormat = (
	value: string | undefined,
	json: boolean,
): Result<OutputFormat, CliError> => {
	if (json) return ok("json");
	const normalized = emptyToUndefined(value) ?? "table";
	if (normalized === "json" || normalized === "table") {
		return ok(normalized);
	}
	return error({
		type: "usage_error",
		message: "Output format must be json or table.",
	});
};

export const resolveCliConfig = (
	input: ConfigInput,
): Result<CliConfig, CliError> => {
	const storedConfig = input.storedConfig ?? null;
	const flagBaseUrl = emptyToUndefined(input.flags.baseUrl);
	const envBaseUrl = emptyToUndefined(input.env["HOMESTEAD_API_BASE_URL"]);
	const storedBaseUrl = storedConfig?.apiBaseUrl;
	const baseUrlSource = resolveBaseUrlSource({
		flagBaseUrl,
		envBaseUrl,
		storedBaseUrl,
	});
	const baseUrlValue =
		flagBaseUrl ?? envBaseUrl ?? storedBaseUrl ?? defaultApiBaseUrl;
	const baseUrl = normalizeBaseUrl(baseUrlValue);
	if (baseUrl.status === "error") {
		return baseUrl;
	}
	const outputFormat = parseOutputFormat(
		input.flags.format,
		input.flags.json === true || input.env["HOMESTEAD_JSON"] === "1",
	);
	if (outputFormat.status === "error") {
		return outputFormat;
	}
	return ok({
		apiBaseUrl: baseUrl.value,
		apiBaseUrlSource: baseUrlSource,
		token:
			emptyToUndefined(input.flags.token) ??
			emptyToUndefined(input.env["HOMESTEAD_API_TOKEN"]) ??
			storedConfig?.token ??
			null,
		outputFormat: outputFormat.value,
	});
};
