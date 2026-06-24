import { mkdtemp, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { describe, expect, it } from "vitest";

import { createFileConfigStore } from "../src/adapters/file-config-store.js";

describe("file config store", () => {
	it("writes and reads stored CLI config", async () => {
		expect.hasAssertions();
		const directory = await mkdtemp(join(tmpdir(), "homestead-cli-"));
		try {
			const configPath = join(directory, "config.json");
			const store = createFileConfigStore({ HOMESTEAD_CONFIG_PATH: configPath });
			expect(store.status).toBe("ok");
			if (store.status === "error") {
				return;
			}
			await expect(
				store.value.write({
					version: 1,
					apiBaseUrl: "https://api.example.com",
					token: "secret-token",
				}),
			).resolves.toStrictEqual({ status: "ok", value: undefined });
			await expect(store.value.read()).resolves.toStrictEqual({
				status: "loaded",
				config: {
					version: 1,
					apiBaseUrl: "https://api.example.com",
					token: "secret-token",
				},
			});
			expect(await readFile(configPath, "utf8")).not.toContain("undefined");
			await expect(store.value.clear()).resolves.toStrictEqual({
				status: "ok",
				value: undefined,
			});
			await expect(store.value.read()).resolves.toStrictEqual({
				status: "missing",
			});
			await expect(store.value.clear()).resolves.toStrictEqual({
				status: "ok",
				value: undefined,
			});
		} finally {
			await rm(directory, { recursive: true, force: true });
		}
	});
});
