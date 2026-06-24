import { describe, expect, it } from "vitest";

import { parseCli } from "../src/cli/parser.js";

describe("CLI parser", () => {
	it("parses global flags and a homes command", () => {
		expect.hasAssertions();
		expect(
			parseCli([
				"--base-url",
				"https://api.example.com",
				"--token",
				"secret",
				"homes",
			]),
		).toStrictEqual({
			status: "ok",
			value: {
				command: { kind: "homes" },
				flags: { baseUrl: "https://api.example.com", token: "secret" },
			},
		});
		expect(
			parseCli([
				"homes",
				"--base-url",
				"https://api.example.com",
				"--format",
				"json",
			]),
		).toStrictEqual({
			status: "ok",
			value: {
				command: { kind: "homes" },
				flags: { baseUrl: "https://api.example.com", format: "json" },
			},
		});
		expect(parseCli(["homes", "--json"])).toStrictEqual({
			status: "ok",
			value: {
				command: { kind: "homes" },
				flags: { json: true },
			},
		});
	});

	it("parses skill commands", () => {
		expect.hasAssertions();
		expect(parseCli(["skill", "list"])).toStrictEqual({
			status: "ok",
			value: { command: { kind: "skill_list" }, flags: {} },
		});
		expect(parseCli(["skill", "homestead-cli"])).toStrictEqual({
			status: "ok",
			value: { command: { kind: "skill", name: "homestead-cli" }, flags: {} },
		});
	});

	it("parses backup and bulk commands", () => {
		expect.hasAssertions();
		expect(parseCli(["backup-export", "home_1"])).toStrictEqual({
			status: "ok",
			value: {
				command: { kind: "backup_export", homeId: "home_1" },
				flags: {},
			},
		});
		expect(
			parseCli([
				"bulk-preview",
				"home_1",
				"--commands-json",
				'{"commands":[{"kind":"create_asset","body":{"name":"HVAC","type":"hvac"}}]}',
			]),
		).toStrictEqual({
			status: "ok",
			value: {
				command: {
					kind: "bulk_preview",
					homeId: "home_1",
					body: {
						commands: [
							{
								kind: "create_asset",
								body: { name: "HVAC", type: "hvac" },
							},
						],
					},
				},
				flags: {},
			},
		});
		expect(
			parseCli([
				"bulk-apply",
				"home_1",
				"--commands-json",
				'{"commands":[{"kind":"create_task","body":{"title":"Replace filter"}}]}',
			]),
		).toMatchObject({
			status: "ok",
			value: { command: { kind: "bulk_apply", homeId: "home_1" } },
		});
	});

	it("rejects invalid bulk command JSON", () => {
		expect.hasAssertions();
		expect(parseCli(["bulk-preview", "home_1"])).toMatchObject({
			status: "error",
			error: { type: "usage_error", message: "--commands-json is required." },
		});
		expect(
			parseCli(["bulk-preview", "home_1", "--commands-json", "not-json"]),
		).toMatchObject({
			status: "error",
			error: {
				type: "usage_error",
				message: "--commands-json must be valid Homestead bulk JSON.",
			},
		});
		expect(
			parseCli([
				"bulk-preview",
				"home_1",
				"--commands-json",
				'{"commands":[{"kind":"nonsense"}]}',
			]),
		).toMatchObject({
			status: "error",
			error: {
				type: "usage_error",
				message: "--commands-json must be valid Homestead bulk JSON.",
			},
		});
	});

	it("parses template filters", () => {
		expect.hasAssertions();
		expect(
			parseCli(["templates", "--kind", "task", "--category", "maintenance"]),
		).toStrictEqual({
			status: "ok",
			value: {
				command: {
					kind: "templates",
					templateKind: "task",
					category: "maintenance",
				},
				flags: {},
			},
		});
	});

	it("parses login from stdin", () => {
		expect.hasAssertions();
		expect(parseCli(["login", "--token-stdin"])).toStrictEqual({
			status: "ok",
			value: {
				command: { kind: "login", tokenFromStdin: true },
				flags: {},
			},
		});
	});

	it("parses action commands", () => {
		expect.hasAssertions();
		expect(
			parseCli([
				"instantiate-template",
				"home_1",
				"template_1",
				"--asset-id",
				"asset_1",
				"--due-at",
				"2026-06-03T00:00:00.000Z",
			]),
		).toStrictEqual({
			status: "ok",
			value: {
				command: {
					kind: "instantiate_template",
					homeId: "home_1",
					templateId: "template_1",
					assetId: "asset_1",
					dueAt: "2026-06-03T00:00:00.000Z",
				},
				flags: {},
			},
		});
		expect(
			parseCli(["complete-task", "task_1", "--notes", "done"]),
		).toStrictEqual({
			status: "ok",
			value: {
				command: { kind: "complete_task", taskId: "task_1", notes: "done" },
				flags: {},
			},
		});
	});

	it("parses expanded API commands", () => {
		expect.hasAssertions();
		expect(
			parseCli([
				"register",
				"--name",
				"Owner",
				"--email",
				"owner@example.com",
				"--setup-token-stdin",
			]),
		).toStrictEqual({
			status: "ok",
			value: {
				command: {
					kind: "register",
					name: "Owner",
					email: "owner@example.com",
					setupTokenFromStdin: true,
				},
				flags: {},
			},
		});
		expect(parseCli(["revoke-token"])).toStrictEqual({
			status: "ok",
			value: { command: { kind: "revoke_token" }, flags: {} },
		});
		expect(parseCli(["rotate-token"])).toStrictEqual({
			status: "ok",
			value: { command: { kind: "rotate_token" }, flags: {} },
		});
		expect(parseCli(["memberships", "home_1"])).toStrictEqual({
			status: "ok",
			value: { command: { kind: "memberships", homeId: "home_1" }, flags: {} },
		});
		expect(parseCli(["notification-integrations"])).toStrictEqual({
			status: "ok",
			value: { command: { kind: "notification_integrations" }, flags: {} },
		});
		expect(
			parseCli(["set-email-notification", "--email", "owner@example.com"]),
		).toStrictEqual({
			status: "ok",
			value: {
				command: {
					kind: "set_email_notification",
					emailAddress: "owner@example.com",
					status: "enabled",
					deliveryMode: "digest",
				},
				flags: {},
			},
		});
		expect(
			parseCli(["delete-notification-integration", "email"]),
		).toStrictEqual({
			status: "ok",
			value: {
				command: { kind: "delete_notification_integration", channel: "email" },
				flags: {},
			},
		});
		expect(parseCli(["task-reminder-schedule", "task_1"])).toStrictEqual({
			status: "ok",
			value: {
				command: { kind: "task_reminder_schedule", taskId: "task_1" },
				flags: {},
			},
		});
		expect(
			parseCli(["set-task-reminder-schedule", "task_1", "--email-default"]),
		).toStrictEqual({
			status: "ok",
			value: {
				command: {
					kind: "set_task_reminder_schedule",
					taskId: "task_1",
					channels: ["email"],
					rules: [
						{
							frequency: "weekly",
							startsBeforeDueDays: 14,
							endsBeforeDueDays: 7,
						},
						{
							frequency: "daily",
							startsBeforeDueDays: 6,
							endsBeforeDueDays: 0,
						},
					],
				},
				flags: {},
			},
		});
		expect(
			parseCli([
				"set-task-reminder-schedule",
				"task_1",
				"--channel",
				"email",
				"--rule",
				"weekly:14:7",
				"--rule",
				"daily:6:0",
			]),
		).toStrictEqual({
			status: "ok",
			value: {
				command: {
					kind: "set_task_reminder_schedule",
					taskId: "task_1",
					channels: ["email"],
					rules: [
						{
							frequency: "weekly",
							startsBeforeDueDays: 14,
							endsBeforeDueDays: 7,
						},
						{
							frequency: "daily",
							startsBeforeDueDays: 6,
							endsBeforeDueDays: 0,
						},
					],
				},
				flags: {},
			},
		});
		expect(parseCli(["delete-task-reminder-schedule", "task_1"])).toStrictEqual(
			{
				status: "ok",
				value: {
					command: { kind: "delete_task_reminder_schedule", taskId: "task_1" },
					flags: {},
				},
			},
		);
		expect(
			parseCli([
				"reminder-deliveries",
				"home_1",
				"--status",
				"sent",
				"--channel",
				"email",
				"--task-id",
				"task_1",
				"--limit",
				"10",
			]),
		).toStrictEqual({
			status: "ok",
			value: {
				command: {
					kind: "reminder_deliveries",
					homeId: "home_1",
					status: "sent",
					channel: "email",
					taskId: "task_1",
					limit: 10,
				},
				flags: {},
			},
		});
		expect(parseCli(["template", "template_1"])).toStrictEqual({
			status: "ok",
			value: {
				command: { kind: "template", templateId: "template_1" },
				flags: {},
			},
		});
		expect(parseCli(["asset", "asset_1"])).toStrictEqual({
			status: "ok",
			value: { command: { kind: "asset", assetId: "asset_1" }, flags: {} },
		});
		expect(parseCli(["task", "task_1"])).toStrictEqual({
			status: "ok",
			value: { command: { kind: "task", taskId: "task_1" }, flags: {} },
		});
		expect(parseCli(["task-completions", "task_1"])).toStrictEqual({
			status: "ok",
			value: {
				command: { kind: "task_completions", taskId: "task_1" },
				flags: {},
			},
		});
		expect(
			parseCli([
				"create-task",
				"home_1",
				"--title",
				"Clean windows",
				"--due-at",
				"2026-06-16T13:00:00.000Z",
				"--repeat-every",
				"2",
				"--repeat-unit",
				"weeks",
			]),
		).toStrictEqual({
			status: "ok",
			value: {
				command: {
					kind: "create_task",
					homeId: "home_1",
					title: "Clean windows",
					dueAt: "2026-06-16T13:00:00.000Z",
					recurrence: { frequency: "weekly", interval: 2 },
				},
				flags: {},
			},
		});
	});

	it("parses asset and task update commands", () => {
		expect.hasAssertions();
		expect(
			parseCli([
				"update-asset",
				"asset_1",
				"--name",
				"Generator",
				"--clear-notes",
			]),
		).toStrictEqual({
			status: "ok",
			value: {
				command: {
					kind: "update_asset",
					assetId: "asset_1",
					name: "Generator",
					notes: null,
				},
				flags: {},
			},
		});
		expect(
			parseCli([
				"update-task",
				"task_1",
				"--status",
				"completed",
				"--clear-due-at",
			]),
		).toStrictEqual({
			status: "ok",
			value: {
				command: {
					kind: "update_task",
					taskId: "task_1",
					status: "completed",
					dueAt: null,
				},
				flags: {},
			},
		});
		expect(
			parseCli([
				"update-task",
				"task_1",
				"--repeat-every",
				"1",
				"--repeat-unit",
				"month",
			]),
		).toStrictEqual({
			status: "ok",
			value: {
				command: {
					kind: "update_task",
					taskId: "task_1",
					recurrence: { frequency: "monthly", interval: 1 },
				},
				flags: {},
			},
		});
		expect(
			parseCli(["update-task", "task_1", "--clear-recurrence"]),
		).toStrictEqual({
			status: "ok",
			value: {
				command: {
					kind: "update_task",
					taskId: "task_1",
					recurrence: null,
				},
				flags: {},
			},
		});
		expect(parseCli(["update-task", "task_1"])).toStrictEqual({
			status: "error",
			error: {
				type: "usage_error",
				message:
					"Usage: homestead update-task <taskId> [--title value] [--asset-id value|--clear-asset-id] [--notes value|--clear-notes] [--due-at value|--clear-due-at] [--repeat-every n --repeat-unit day|week|month|year|--clear-recurrence] [--status open|completed]",
			},
		});
	});

	it("parses asset and task resource commands", () => {
		expect.hasAssertions();
		expect(
			parseCli([
				"assets",
				"home_1",
				"--type",
				"generator",
				"--status",
				"active",
			]),
		).toStrictEqual({
			status: "ok",
			value: {
				command: {
					kind: "assets",
					homeId: "home_1",
					assetType: "generator",
					status: "active",
				},
				flags: {},
			},
		});
		expect(
			parseCli([
				"create-asset",
				"home_1",
				"--name",
				"Generator",
				"--type",
				"generator",
				"--profile-json",
				'{"fuel":"gasoline"}',
			]),
		).toStrictEqual({
			status: "ok",
			value: {
				command: {
					kind: "create_asset",
					homeId: "home_1",
					name: "Generator",
					assetType: "generator",
					profile: { fuel: "gasoline" },
				},
				flags: {},
			},
		});
		expect(parseCli(["archive-asset", "asset_1"])).toStrictEqual({
			status: "ok",
			value: {
				command: { kind: "archive_asset", assetId: "asset_1" },
				flags: {},
			},
		});
		expect(parseCli(["tasks", "home_1", "--status", "open"])).toStrictEqual({
			status: "ok",
			value: {
				command: { kind: "tasks", homeId: "home_1", status: "open" },
				flags: {},
			},
		});
		expect(
			parseCli(["create-task", "home_1", "--title", "Change oil"]),
		).toStrictEqual({
			status: "ok",
			value: {
				command: { kind: "create_task", homeId: "home_1", title: "Change oil" },
				flags: {},
			},
		});
		expect(parseCli(["archive-task", "task_1"])).toStrictEqual({
			status: "ok",
			value: { command: { kind: "archive_task", taskId: "task_1" }, flags: {} },
		});
	});

	it("rejects invalid resource command options", () => {
		expect.hasAssertions();
		expect(parseCli(["assets", "home_1", "--status", "missing"])).toStrictEqual(
			{
				status: "error",
				error: {
					type: "usage_error",
					message: "Asset status must be active or archived.",
				},
			},
		);
		expect(parseCli(["tasks", "home_1", "--status", "missing"])).toStrictEqual({
			status: "error",
			error: {
				type: "usage_error",
				message: "Task status must be open, completed, or archived.",
			},
		});
		expect(
			parseCli([
				"create-asset",
				"home_1",
				"--name",
				"Bad",
				"--type",
				"thing",
				"--profile-json",
				"[]",
			]),
		).toStrictEqual({
			status: "error",
			error: {
				type: "usage_error",
				message: "--profile-json must be a JSON object.",
			},
		});
		expect(parseCli(["assets", "home_1", "--notes", "typo"])).toStrictEqual({
			status: "error",
			error: {
				type: "usage_error",
				message: "Unknown option for command: --notes",
			},
		});
	});

	it("rejects unknown commands with actionable help", () => {
		expect.hasAssertions();
		expect(parseCli(["login--help"])).toStrictEqual({
			status: "error",
			error: {
				type: "usage_error",
				message:
					"Unknown command: login--help\n\nDid you mean?\n  homestead login --help\n\nRun:\n  homestead --help",
			},
		});
		expect(parseCli(["frobnicate"])).toStrictEqual({
			status: "error",
			error: {
				type: "usage_error",
				message: "Unknown command: frobnicate\n\nRun:\n  homestead --help",
			},
		});
	});

	it("rejects missing command arguments", () => {
		expect.hasAssertions();
		expect(parseCli(["summary"])).toStrictEqual({
			status: "error",
			error: {
				type: "usage_error",
				message: "Usage: homestead summary <homeId>",
			},
		});
	});

	it("returns Commander help text", () => {
		expect.hasAssertions();
		expect(parseCli([])).toMatchObject({
			status: "ok",
			value: {
				helpText: expect.stringContaining("Usage: homestead [options] [command]"),
			},
		});
		expect(parseCli(["--help"])).toMatchObject({
			status: "ok",
			value: {
				helpText: expect.stringContaining("Usage: homestead [options] [command]"),
			},
		});
		expect(parseCli(["--help"])).toMatchObject({
			status: "ok",
			value: { helpText: expect.stringContaining("reminder-deliveries") },
		});

		expect(parseCli(["reminder-deliveries", "--help"])).toMatchObject({
			status: "ok",
			value: {
				helpText: expect.stringContaining(
					"Usage: homestead reminder-deliveries [options] [homeId]",
				),
			},
		});
		expect(parseCli(["reminder-deliveries", "--help"])).toMatchObject({
			status: "ok",
			value: { helpText: expect.stringContaining("--limit <limit>") },
		});
	});
});
