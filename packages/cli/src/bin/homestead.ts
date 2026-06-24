#!/usr/bin/env node
import { spawn } from "node:child_process";

import { createFileConfigStore } from "../adapters/file-config-store.js";
import { runCli } from "../cli/run-cli.js";
import type { CliError } from "../core/errors.js";
import type { Result } from "../core/result.js";

const readStdin = async (): Promise<string> => {
	const chunks: Buffer[] = [];
	for await (const chunk of process.stdin) {
		chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
	}
	return Buffer.concat(chunks).toString("utf8");
};

const openUrlCommand = (
	url: string,
): { readonly command: string; readonly args: readonly string[] } => {
	if (process.platform === "darwin") return { command: "open", args: [url] };
	if (process.platform === "win32") {
		return {
			command: "rundll32.exe",
			args: ["url.dll,FileProtocolHandler", url],
		};
	}
	return { command: "xdg-open", args: [url] };
};

const openUrl = async (url: string): Promise<Result<void, CliError>> => {
	const { command, args } = openUrlCommand(url);
	try {
		const child = spawn(command, args, { detached: true, stdio: "ignore" });
		return await new Promise<Result<void, CliError>>((resolve) => {
			child.once("error", (error) => {
				resolve({
					status: "error",
					error: {
						type: "config_error",
						message: `Unable to open the device login URL automatically: ${error.message}`,
					},
				});
			});
			child.once("spawn", () => {
				child.unref();
				resolve({ status: "ok", value: undefined });
			});
		});
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Unknown opener error";
		return {
			status: "error",
			error: {
				type: "config_error",
				message: `Unable to open the device login URL automatically: ${message}`,
			},
		};
	}
};

const configStore = createFileConfigStore(process.env);
const result = await runCli({
	args: process.argv.slice(2),
	env: process.env,
	stdout: process.stdout,
	stderr: process.stderr,
	...(configStore.status === "ok" ? { configStore: configStore.value } : {}),
	stdin: { read: readStdin },
	openUrl,
});

process.exitCode = result.exitCode;
