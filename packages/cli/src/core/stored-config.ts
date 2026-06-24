import { z } from "zod";

import type { CliError } from "./errors.js";
import { error, ok, type Result } from "./result.js";

export type StoredCliConfig = {
	readonly version: 1;
	readonly apiBaseUrl: string;
	readonly token: string;
	readonly tokenExpiresAt?: string;
	readonly scopes?: readonly string[];
};

const StoredCliConfigSchema = z
	.object({
		version: z.literal(1),
		apiBaseUrl: z.string().trim().min(1),
		token: z.string().trim().min(1),
		tokenExpiresAt: z.string().trim().min(1).optional(),
		scopes: z.array(z.string().trim().min(1)).optional(),
	})
	.strict();

export const parseStoredConfig = (
	content: string,
): Result<StoredCliConfig, CliError> => {
	try {
		const json = JSON.parse(content) as unknown;
		const parsed = StoredCliConfigSchema.safeParse(json);
		if (!parsed.success) {
			return error({
				type: "config_error",
				message: "Stored Homestead CLI config is invalid.",
			});
		}
		return ok({
			version: parsed.data.version,
			apiBaseUrl: parsed.data.apiBaseUrl,
			token: parsed.data.token,
			...(parsed.data.tokenExpiresAt === undefined
				? {}
				: { tokenExpiresAt: parsed.data.tokenExpiresAt }),
			...(parsed.data.scopes === undefined
				? {}
				: { scopes: parsed.data.scopes }),
		});
	} catch {
		return error({
			type: "config_error",
			message: "Stored Homestead CLI config is not valid JSON.",
		});
	}
};

export const serializeStoredConfig = (config: StoredCliConfig): string =>
	`${JSON.stringify(config, null, 2)}\n`;
