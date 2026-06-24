import { describe, expect, it } from "vitest";

import { planCliApiOperation } from "../src/core/api-client-command.js";
import type { CliConfig } from "../src/core/config.js";

const config = (token: string | null = "token"): CliConfig => ({
	apiBaseUrl: "https://api.example.com",
	apiBaseUrlSource: "flag",
	token,
	outputFormat: "table",
});

describe("CLI API operation planning", () => {
	it("guards authenticated operations before SDK execution", () => {
		expect.hasAssertions();
		expect(planCliApiOperation({ kind: "health" }, config(null))).toStrictEqual(
			{ status: "ok", value: { kind: "health" } },
		);
		expect(planCliApiOperation({ kind: "homes" }, config(null))).toStrictEqual({
			status: "error",
			error: {
				type: "authentication_config_error",
				message:
					"This command requires HOMESTEAD_API_TOKEN, stored login, or the --token flag.",
			},
		});
	});

	it("maps commands to SDK operation inputs without URL/header planning", () => {
		expect.hasAssertions();
		expect(
			planCliApiOperation(
				{
					kind: "set_email_notification",
					emailAddress: "owner@example.com",
					status: "enabled",
					deliveryMode: "digest",
				},
				config(),
			),
		).toStrictEqual({
			status: "ok",
			value: {
				kind: "set_email_notification",
				body: {
					status: "enabled",
					config: {
						emailAddress: "owner@example.com",
						deliveryMode: "digest",
					},
				},
			},
		});
		expect(
			planCliApiOperation(
				{
					kind: "set_task_reminder_schedule",
					taskId: "task_1",
					channels: ["email"],
					rules: [
						{
							frequency: "weekly",
							startsBeforeDueDays: 14,
							endsBeforeDueDays: 7,
						},
					],
				},
				config(),
			),
		).toStrictEqual({
			status: "ok",
			value: {
				kind: "set_task_reminder_schedule",
				taskId: "task_1",
				body: {
					channels: ["email"],
					rules: [
						{
							frequency: "weekly",
							startsBeforeDueDays: 14,
							endsBeforeDueDays: 7,
						},
					],
				},
			},
		});
		expect(
			planCliApiOperation(
				{
					kind: "create_task",
					homeId: "home_1",
					title: "Clean windows",
					dueAt: "2026-06-16T13:00:00.000Z",
					recurrence: { frequency: "weekly", interval: 2 },
				},
				config(),
			),
		).toStrictEqual({
			status: "ok",
			value: {
				kind: "create_task",
				homeId: "home_1",
				body: {
					title: "Clean windows",
					dueAt: "2026-06-16T13:00:00.000Z",
					recurrence: { frequency: "weekly", interval: 2 },
				},
			},
		});
		expect(
			planCliApiOperation(
				{ kind: "complete_task", taskId: "task_1" },
				config(),
			),
		).toStrictEqual({
			status: "ok",
			value: { kind: "complete_task", taskId: "task_1", body: {} },
		});
		expect(
			planCliApiOperation(
				{ kind: "update_asset", assetId: "asset_1", notes: null },
				config(),
			),
		).toStrictEqual({
			status: "ok",
			value: {
				kind: "update_asset",
				assetId: "asset_1",
				body: { notes: null },
			},
		});
		expect(
			planCliApiOperation(
				{
					kind: "update_task",
					taskId: "task_1",
					dueAt: null,
					recurrence: null,
					status: "completed",
				},
				config(),
			),
		).toStrictEqual({
			status: "ok",
			value: {
				kind: "update_task",
				taskId: "task_1",
				body: { dueAt: null, recurrence: null, status: "completed" },
			},
		});
		expect(
			planCliApiOperation(
				{ kind: "templates", templateKind: "task", category: "maintenance" },
				config(),
			),
		).toStrictEqual({
			status: "ok",
			value: {
				kind: "templates",
				query: { kind: "task", category: "maintenance" },
			},
		});
	});
});
