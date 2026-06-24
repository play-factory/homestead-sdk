import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		include: ["test/integration/**/*.integration.ts"],
		testTimeout: 20_000,
	},
});
