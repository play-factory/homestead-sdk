import type { ApiClientError } from "./errors.js";
import { error, ok, type Result } from "./result.js";

export type ApiAuth =
	| { readonly type: "anonymous" }
	| { readonly type: "bearer"; readonly token: string };

export type ApiClientConfig = {
	readonly baseUrl: string;
	readonly auth: ApiAuth;
};

export const normalizeApiBaseUrl = (
	baseUrl: string,
): Result<string, ApiClientError> => {
	try {
		const url = new URL(baseUrl);
		if (url.protocol !== "http:" && url.protocol !== "https:") {
			return error({
				type: "configuration_error",
				message: "API base URL must be a valid URL.",
			});
		}
		url.pathname = url.pathname.replace(/\/$/u, "");
		url.search = "";
		url.hash = "";
		return ok(url.toString().replace(/\/$/u, ""));
	} catch {
		return error({
			type: "configuration_error",
			message: "API base URL must be a valid URL.",
		});
	}
};
