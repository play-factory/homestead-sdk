import { mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

import {
	parseStoredConfig,
	serializeStoredConfig,
	type StoredCliConfig,
} from "../core/stored-config.js";
import { error, ok, type Result } from "../core/result.js";
import type { CliError } from "../core/errors.js";

export type StoredConfigReadResult =
	| { readonly status: "missing" }
	| { readonly status: "loaded"; readonly config: StoredCliConfig }
	| { readonly status: "invalid"; readonly error: CliError };

export type ConfigStore = {
	readonly path: string;
	readonly read: () => Promise<StoredConfigReadResult>;
	readonly write: (config: StoredCliConfig) => Promise<Result<void, CliError>>;
	readonly clear: () => Promise<Result<void, CliError>>;
};

const defaultConfigPath = (
	env: Readonly<Record<string, string | undefined>>,
): Result<string, CliError> => {
	const explicit = env["HOMESTEAD_CONFIG_PATH"]?.trim();
	if (explicit !== undefined && explicit.length > 0) {
		return ok(explicit);
	}
	const configHome = env["XDG_CONFIG_HOME"]?.trim();
	if (configHome !== undefined && configHome.length > 0) {
		return ok(join(configHome, "homestead", "config.json"));
	}
	const home = env["HOME"]?.trim();
	if (home !== undefined && home.length > 0) {
		return ok(join(home, ".config", "homestead", "config.json"));
	}
	return error({
		type: "config_error",
		message: "HOME or HOMESTEAD_CONFIG_PATH is required to store CLI login.",
	});
};

export const createFileConfigStore = (
	env: Readonly<Record<string, string | undefined>>,
): Result<ConfigStore, CliError> => {
	const path = defaultConfigPath(env);
	if (path.status === "error") {
		return path;
	}
	return ok({
		path: path.value,
		read: async () => {
			try {
				const content = await readFile(path.value, "utf8");
				const parsed = parseStoredConfig(content);
				return parsed.status === "ok"
					? { status: "loaded", config: parsed.value }
					: { status: "invalid", error: parsed.error };
			} catch (caught) {
				if (
					caught instanceof Error &&
					"code" in caught &&
					caught.code === "ENOENT"
				) {
					return { status: "missing" };
				}
				return {
					status: "invalid",
					error: {
						type: "config_error",
						message: "Unable to read stored Homestead CLI config.",
					},
				};
			}
		},
		clear: async () => {
			try {
				await unlink(path.value);
				return ok(undefined);
			} catch (caught) {
				if (
					caught instanceof Error &&
					"code" in caught &&
					caught.code === "ENOENT"
				) {
					return ok(undefined);
				}
				return error({
					type: "config_error",
					message: "Unable to clear Homestead CLI config.",
				});
			}
		},
		write: async (config) => {
			try {
				const directory = dirname(path.value);
				await mkdir(directory, { recursive: true, mode: 0o700 });
				const temporaryPath = `${path.value}.tmp`;
				await writeFile(temporaryPath, serializeStoredConfig(config), {
					mode: 0o600,
				});
				await rename(temporaryPath, path.value);
				return ok(undefined);
			} catch {
				return error({
					type: "config_error",
					message: "Unable to write Homestead CLI config.",
				});
			}
		},
	});
};
