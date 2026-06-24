import { z } from "zod";

import type { ApiClientError } from "./errors.js";
import { error, ok, type Result } from "./result.js";

export type HttpResponse = {
	readonly status: number;
	readonly bodyText: string;
};

// Error responses are parsed defensively so callers still receive a safe
// api_error when an intermediary or future server version returns a partial
// error envelope.
const ErrorEnvelopeSchema = z.object({
	error: z.object({
		code: z.string().optional(),
		message: z.string(),
	}),
	meta: z.object({ requestId: z.string().optional() }).optional(),
});

const parseJsonBody = (bodyText: string): Result<unknown, ApiClientError> => {
	try {
		return ok(JSON.parse(bodyText) as unknown);
	} catch {
		return error({
			type: "contract_error",
			message: "Response body must be valid JSON.",
		});
	}
};

const toApiError = (status: number, body: unknown): ApiClientError => {
	const parsed = ErrorEnvelopeSchema.safeParse(body);
	if (!parsed.success) {
		return {
			type: "api_error",
			status,
			message: `API request failed with HTTP ${status}.`,
		};
	}
	return {
		type: "api_error",
		status,
		...(parsed.data.error.code === undefined
			? {}
			: { code: parsed.data.error.code }),
		message: parsed.data.error.message,
		...(parsed.data.meta?.requestId === undefined
			? {}
			: { requestId: parsed.data.meta.requestId }),
	};
};

export const parseHttpResponse = <T>(
	response: HttpResponse,
	schema: z.ZodType<T>,
	operationName: string,
): Result<T, ApiClientError> => {
	if (response.status === 204 && response.bodyText.length === 0) {
		const parsed = schema.safeParse(undefined);
		return parsed.success
			? ok(parsed.data)
			: error({
					type: "contract_error",
					message: `Unexpected ${operationName} response.`,
				});
	}

	const json = parseJsonBody(response.bodyText);
	if (json.status === "error") return json;
	if (response.status < 200 || response.status >= 300) {
		return error(toApiError(response.status, json.value));
	}
	const parsed = schema.safeParse(json.value);
	return parsed.success
		? ok(parsed.data)
		: error({
				type: "contract_error",
				message: `Unexpected ${operationName} response.`,
			});
};
