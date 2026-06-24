import type { ApiAuth } from "./config.js";
import { buildJsonHeaders } from "./headers.js";
import { joinApiUrl } from "./url.js";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type ApiRequestSpec = {
	readonly method: HttpMethod;
	readonly url: string;
	readonly headers: Record<string, string>;
	readonly bodyText?: string;
};

export const buildJsonRequestSpec = ({
	baseUrl,
	auth,
	method,
	path,
	pathParams,
	query,
	body,
}: {
	readonly baseUrl: string;
	readonly auth: ApiAuth;
	readonly method: HttpMethod;
	readonly path: string;
	readonly pathParams?: Readonly<Record<string, string>>;
	readonly query?: Readonly<Record<string, string | number | undefined>>;
	readonly body?: unknown;
}): ApiRequestSpec => {
	const bodyText = body === undefined ? undefined : JSON.stringify(body);
	const urlParameters = {
		...(pathParams === undefined ? {} : { path: pathParams }),
		...(query === undefined ? {} : { query }),
	};
	return {
		method,
		url: joinApiUrl(baseUrl, path, urlParameters),
		headers: buildJsonHeaders({ auth, includeBody: bodyText !== undefined }),
		...(bodyText === undefined ? {} : { bodyText }),
	};
};
