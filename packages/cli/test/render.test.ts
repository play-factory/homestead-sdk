import { describe, expect, it } from "vitest";

import { renderError, renderSuccess } from "../src/core/render.js";

describe("CLI render", () => {
	it("renders actionable network errors", () => {
		expect.hasAssertions();

		expect(
			renderError({
				type: "network_error",
				message: 'Unable to reach Homestead API while running "health".',
				command: "health",
				apiBaseUrl: "https://api.homestead.work",
				apiBaseUrlSource: "default",
				apiBaseUrlSourceLabel: "default production URL",
				failureKind: "fetch_failed",
				causeMessage: "fetch failed",
				suggestions: ["Start the local API server: pnpm dev"],
			}),
		).toContain("API base URL: https://api.homestead.work");
	});

	it("renders stable JSON success envelopes", () => {
		expect.hasAssertions();

		expect(
			JSON.parse(
				renderSuccess({ kind: "health", status: "ok" }, "json", "health"),
			) as unknown,
		).toStrictEqual({ ok: true, command: "health", data: { status: "ok" } });
	});

	it("renders stable JSON error envelopes", () => {
		expect.hasAssertions();

		expect(
			JSON.parse(
				renderError(
					{
						type: "authentication_config_error",
						message: "Missing token.",
					},
					"json",
					"homes",
				),
			) as unknown,
		).toStrictEqual({
			ok: false,
			command: "homes",
			error: { code: "auth_required", message: "Missing token.", details: {} },
		});
	});

	it("renders reminder delivery history without provider or recipient details", () => {
		expect.hasAssertions();

		expect(
			renderSuccess(
				{
					kind: "reminder_deliveries",
					data: {
						items: [
							{
								id: "delivery_1",
								homeId: "home_1",
								taskId: "task_1",
								taskTitle: "Change filter",
								channel: "email",
								scheduledFor: "2026-06-24T00:00:00.000Z",
								dueAt: "2026-07-01T15:00:00.000Z",
								status: "sent",
								attemptCount: 1,
								lastError: null,
								createdAt: "2026-06-24T13:00:00.000Z",
								updatedAt: "2026-06-24T13:00:00.000Z",
							},
						],
					},
				},
				"table",
			),
		).toBe(
			"ID\tTASK\tCHANNEL\tSTATUS\tSCHEDULED_FOR\tATTEMPTS\ndelivery_1\tChange filter\temail\tsent\t2026-06-24T00:00:00.000Z\t1\n",
		);
	});
});
