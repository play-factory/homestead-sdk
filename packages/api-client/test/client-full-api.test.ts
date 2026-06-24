import { describe, expect, it } from "vitest";

import { createHomesteadApiClient, type FetchLike } from "../src/index.js";

const jsonResponse = (status: number, body: unknown): Response =>
	new Response(JSON.stringify(body), {
		status,
		headers: { "Content-Type": "application/json" },
	});

const asset = {
	id: "asset_1",
	homeId: "home_1",
	parentAssetId: null,
	name: "Generator",
	type: "generator",
	profile: {},
	notes: null,
	archivedAt: null,
	createdAt: "2026-06-03T00:00:00.000Z",
	updatedAt: "2026-06-03T00:00:00.000Z",
};

const task = {
	id: "task_1",
	homeId: "home_1",
	assetId: "asset_1",
	title: "Change oil",
	notes: null,
	status: "open",
	dueAt: null,
	completedAt: null,
	archivedAt: null,
	createdAt: "2026-06-03T00:00:00.000Z",
	updatedAt: "2026-06-03T00:00:00.000Z",
} as const;

const template = {
	id: "template_1",
	kind: "task",
	category: "maintenance",
	title: "Exercise generator",
	description: null,
	definition: {
		kind: "task",
		task: { title: "Exercise generator", assetType: "generator" },
	},
	sortOrder: 1,
	createdAt: "2026-06-03T00:00:00.000Z",
	updatedAt: "2026-06-03T00:00:00.000Z",
} as const;

const completion = {
	id: "completion_1",
	taskId: "task_1",
	homeId: "home_1",
	completedByUserId: "user_1",
	completedAt: "2026-06-03T00:00:00.000Z",
	notes: "done",
	createdAt: "2026-06-03T00:00:00.000Z",
};

const notificationIntegration = {
	channel: "email",
	userId: "user_1",
	status: "enabled",
	config: { emailAddress: "charles@example.com", deliveryMode: "digest" },
	createdAt: "2026-06-04T00:00:00.000Z",
	updatedAt: "2026-06-04T00:00:00.000Z",
} as const;

const apiToken = {
	id: "token_1",
	label: "CLI token",
	clientType: "integration",
	scopes: ["profile:read", "homes:read"],
	homeIds: null,
	createdAt: "2026-06-23T00:00:00.000Z",
	expiresAt: "2026-09-21T00:00:00.000Z",
	revokedAt: null,
	lastUsedAt: null,
} as const;

const reminderSchedule = {
	taskId: "task_1",
	userId: "user_1",
	channels: ["email", "telegram"],
	rules: [
		{ frequency: "weekly", startsBeforeDueDays: 30, endsBeforeDueDays: 8 },
		{ frequency: "daily", startsBeforeDueDays: 7, endsBeforeDueDays: 0 },
	],
	createdAt: "2026-06-03T00:00:00.000Z",
	updatedAt: "2026-06-03T00:00:00.000Z",
} as const;

const responseFor = (method: string, url: string): unknown => {
	if (url.endsWith("/auth/register"))
		return {
			data: {
				user: { id: "user_1", name: "Owner" },
				token: "new-token",
				homes: [],
			},
		};
	if (url.endsWith("/auth/tokens/revoke-current"))
		return { data: { revokedAt: "2026-06-03T00:00:00.000Z" } };
	if (url.endsWith("/auth/tokens/rotate-current"))
		return { data: { token: "rotated-token" } };
	if (url.endsWith("/me/api-tokens"))
		return method === "GET"
			? { data: { items: [apiToken] } }
			: { data: { token: "hos_created", apiToken } };
	if (url.endsWith("/me/api-tokens/token_1"))
		return {
			data: {
				apiToken: {
					...apiToken,
					revokedAt: "2026-06-23T01:00:00.000Z",
				},
			},
		};
	if (url.endsWith("/device-login/start"))
		return {
			data: {
				deviceCode: "device-secret",
				userCode: "ABCD-EFGH",
				verificationUri: "https://homestead.work/device",
				verificationUriComplete: "https://homestead.work/device?code=ABCD-EFGH",
				expiresIn: 600,
				interval: 5,
			},
		};
	if (url.endsWith("/device-login/requests/ABCD-EFGH"))
		return {
			data: {
				clientName: "Homestead CLI",
				clientType: "cli",
				requestedScopes: ["profile:read"],
				requestedExpiresAt: "2026-09-20T12:00:00.000Z",
				expiresAt: "2026-06-22T12:10:00.000Z",
			},
		};
	if (url.endsWith("/device-login/approve"))
		return { data: { status: "approved" } };
	if (url.endsWith("/device-login/deny")) return { data: { status: "denied" } };
	if (url.endsWith("/device-login/token"))
		return {
			data: {
				status: "approved",
				accessToken: "device-token",
				tokenType: "Bearer",
				expiresAt: "2026-09-20T12:00:00.000Z",
				scopes: ["profile:read"],
			},
		};
	if (url.includes("/notification-integrations"))
		return method === "GET"
			? { data: { items: [notificationIntegration] } }
			: { data: { integration: notificationIntegration } };
	if (url.endsWith("/memberships"))
		return {
			data: {
				items: [
					{
						id: "membership_1",
						homeId: "home_1",
						role: "owner",
						user: { id: "user_1", name: "Owner" },
					},
				],
			},
		};
	if (url.endsWith("/backup"))
		return {
			data: {
				kind: "homestead.backup",
				schemaVersion: 1,
				exportedAt: "2026-06-03T00:00:00.000Z",
				home: { id: "home_1", name: "Home" },
				assets: [{ ...asset, homeId: undefined }],
				tasks: [{ ...task, homeId: undefined }],
				taskCompletions: [
					{
						id: completion.id,
						taskId: completion.taskId,
						completedByUserId: completion.completedByUserId,
						completedAt: completion.completedAt,
						notes: completion.notes,
						createdAt: completion.createdAt,
					},
				],
			},
		};
	if (url.endsWith("/bulk/preview"))
		return {
			data: {
				status: "valid",
				plan: {
					homeId: "home_1",
					operations: [
						{
							index: 0,
							kind: "create_asset",
							summary: "Create asset Generator",
						},
					],
				},
			},
		};
	if (url.endsWith("/bulk/apply"))
		return {
			data: { homeId: "home_1", created: { assets: [asset], tasks: [task] } },
		};
	if (url.endsWith("/summary"))
		return {
			data: {
				homeId: "home_1",
				counts: {
					assets: { total: 1, active: 1, archived: 0 },
					tasks: { total: 1, open: 1, completed: 0, archived: 0 },
					due: {
						overdue: 0,
						dueToday: 0,
						dueThisWeek: 1,
						upcoming: 0,
						unscheduled: 0,
					},
				},
			},
		};
	if (url.includes("/reminder-deliveries"))
		return {
			data: {
				items: [
					{
						id: "delivery_1",
						homeId: "home_1",
						taskId: "task_1",
						taskTitle: "Change oil",
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
		};
	if (url.includes("/curated-template-recommendations"))
		return {
			data: {
				items: [
					{
						template,
						reason: {
							type: "asset_type_match",
							assetType: "generator",
							assetIds: ["asset_1"],
						},
					},
				],
			},
		};
	if (url.includes("/curated-templates/") && url.includes("/instantiations"))
		return { data: { kind: "task", task } };
	if (url.includes("/curated-templates/template_1"))
		return { data: { template } };
	if (url.includes("/curated-templates"))
		return { data: { items: [template] } };
	if (url.includes("/assets/asset_1")) return { data: { asset } };
	if (url.includes("/homes/home_1/assets"))
		return url.includes("type=")
			? { data: { items: [asset] } }
			: { data: { asset } };
	if (url.includes("/tasks/task_1/reminder-schedule"))
		return { data: { schedule: reminderSchedule } };
	if (url.includes("/tasks/task_1/completions"))
		return method === "GET"
			? { data: { items: [completion] } }
			: { data: { task, completion } };
	if (url.includes("/tasks/task_1")) return { data: { task } };
	if (url.includes("/homes/home_1/tasks"))
		return url.includes("status=")
			? { data: { items: [task] } }
			: { data: { task } };
	return { data: { status: "ok" } };
};

describe("full API client surface", () => {
	it("builds requests for all current API operations", async () => {
		expect.hasAssertions();
		const requests: Array<{
			method: string;
			url: string;
			contentType: string | null;
			body: string | undefined;
		}> = [];
		const fetch: FetchLike = async (input, init) => {
			const method = init?.method ?? "GET";
			const url = String(input);
			const headers =
				init?.headers instanceof Headers
					? init.headers
					: new Headers(init?.headers);
			requests.push({
				method,
				url,
				contentType: headers.get("Content-Type"),
				body: init?.body?.toString(),
			});
			return method === "DELETE" &&
				(url.endsWith("/reminder-schedule") ||
					url.endsWith("/notification-integrations/email"))
				? new Response(null, { status: 204 })
				: jsonResponse(200, responseFor(method, url));
		};
		const client = createHomesteadApiClient({
			baseUrl: "https://api.example.com",
			auth: { type: "bearer", token: "secret-token" },
			fetch,
		});

		const results = await Promise.all([
			client.registerUser({ name: "Owner" }),
			client.revokeCurrentToken(),
			client.rotateCurrentToken(),
			client.listApiTokens(),
			client.createApiToken({ label: "CLI", expiresInDays: 90 }),
			client.revokeApiToken({ tokenId: "token_1" }),
			client.startDeviceLogin({
				clientName: "Homestead CLI",
				clientType: "cli",
				requestedScopes: ["cli:standard"],
				expiresInDays: 90,
			}),
			client.getDeviceLoginRequest({ userCode: "ABCD-EFGH" }),
			client.approveDeviceLogin({
				userCode: "ABCD-EFGH",
				approvedScopes: ["profile:read"],
				approvedExpiresAt: "2026-09-20T12:00:00.000Z",
			}),
			client.denyDeviceLogin({ userCode: "ABCD-EFGH" }),
			client.pollDeviceLoginToken({ deviceCode: "device-secret" }),
			client.listNotificationIntegrations(),
			client.putEmailNotificationIntegration({
				status: "enabled",
				config: {
					emailAddress: "charles@example.com",
					deliveryMode: "digest",
				},
			}),
			client.putTelegramNotificationIntegration({
				status: "disabled",
				config: { chatId: "123456789", username: "charles_home" },
			}),
			client.deleteNotificationIntegration({ channel: "email" }),
			client.listHomeMemberships({ homeId: "home_1" }),
			client.getHomeSummary({ homeId: "home_1" }),
			client.exportHomeBackup({ homeId: "home_1" }),
			client.previewBulkApply({
				homeId: "home_1",
				body: {
					commands: [
						{
							kind: "create_asset",
							body: { name: "Generator", type: "generator" },
						},
					],
				},
			}),
			client.applyBulk({
				homeId: "home_1",
				body: {
					commands: [
						{
							kind: "create_asset",
							body: { name: "Generator", type: "generator" },
						},
					],
				},
			}),
			client.listReminderDeliveryHistory({
				homeId: "home_1",
				query: { status: "sent", channel: "email", limit: 10 },
			}),
			client.listCuratedTemplates({
				query: { kind: "task", category: "maintenance" },
			}),
			client.getCuratedTemplate({ templateId: "template_1" }),
			client.listCuratedTemplateRecommendations({ homeId: "home_1" }),
			client.instantiateCuratedTemplate({
				homeId: "home_1",
				templateId: "template_1",
				body: { assetId: "asset_1" },
			}),
			client.listAssets({
				homeId: "home_1",
				query: { type: "generator", status: "active" },
			}),
			client.createAsset({
				homeId: "home_1",
				body: { name: "Generator", type: "generator" },
			}),
			client.getAsset({ assetId: "asset_1" }),
			client.patchAsset({ assetId: "asset_1", body: { notes: "updated" } }),
			client.archiveAsset({ assetId: "asset_1" }),
			client.listTasks({
				homeId: "home_1",
				query: { assetId: "asset_1", status: "open" },
			}),
			client.createTask({
				homeId: "home_1",
				body: { title: "Change oil", assetId: "asset_1" },
			}),
			client.getTask({ taskId: "task_1" }),
			client.patchTask({ taskId: "task_1", body: { notes: "updated" } }),
			client.archiveTask({ taskId: "task_1" }),
			client.getTaskReminderSchedule({ taskId: "task_1" }),
			client.putTaskReminderSchedule({
				taskId: "task_1",
				body: {
					channels: ["email", "telegram"],
					rules: [
						{
							frequency: "weekly",
							startsBeforeDueDays: 30,
							endsBeforeDueDays: 8,
						},
						{
							frequency: "daily",
							startsBeforeDueDays: 7,
							endsBeforeDueDays: 0,
						},
					],
				},
			}),
			client.deleteTaskReminderSchedule({ taskId: "task_1" }),
			client.listTaskCompletions({ taskId: "task_1" }),
			client.completeTask({ taskId: "task_1", body: { notes: "done" } }),
		]);

		expect(results.every((result) => result.status === "ok")).toBe(true);

		expect(requests.map(({ method, url }) => `${method} ${url}`)).toStrictEqual(
			[
				"POST https://api.example.com/api/v1/auth/register",
				"POST https://api.example.com/api/v1/auth/tokens/revoke-current",
				"POST https://api.example.com/api/v1/auth/tokens/rotate-current",
				"GET https://api.example.com/api/v1/me/api-tokens",
				"POST https://api.example.com/api/v1/me/api-tokens",
				"DELETE https://api.example.com/api/v1/me/api-tokens/token_1",
				"POST https://api.example.com/api/v1/device-login/start",
				"GET https://api.example.com/api/v1/device-login/requests/ABCD-EFGH",
				"POST https://api.example.com/api/v1/device-login/approve",
				"POST https://api.example.com/api/v1/device-login/deny",
				"POST https://api.example.com/api/v1/device-login/token",
				"GET https://api.example.com/api/v1/me/notification-integrations",
				"PUT https://api.example.com/api/v1/me/notification-integrations/email",
				"PUT https://api.example.com/api/v1/me/notification-integrations/telegram",
				"DELETE https://api.example.com/api/v1/me/notification-integrations/email",
				"GET https://api.example.com/api/v1/homes/home_1/memberships",
				"GET https://api.example.com/api/v1/homes/home_1/summary",
				"GET https://api.example.com/api/v1/homes/home_1/backup",
				"POST https://api.example.com/api/v1/homes/home_1/bulk/preview",
				"POST https://api.example.com/api/v1/homes/home_1/bulk/apply",
				"GET https://api.example.com/api/v1/homes/home_1/reminder-deliveries?channel=email&limit=10&status=sent",
				"GET https://api.example.com/api/v1/curated-templates?category=maintenance&kind=task",
				"GET https://api.example.com/api/v1/curated-templates/template_1",
				"GET https://api.example.com/api/v1/homes/home_1/curated-template-recommendations",
				"POST https://api.example.com/api/v1/homes/home_1/curated-templates/template_1/instantiations",
				"GET https://api.example.com/api/v1/homes/home_1/assets?status=active&type=generator",
				"POST https://api.example.com/api/v1/homes/home_1/assets",
				"GET https://api.example.com/api/v1/assets/asset_1",
				"PATCH https://api.example.com/api/v1/assets/asset_1",
				"DELETE https://api.example.com/api/v1/assets/asset_1",
				"GET https://api.example.com/api/v1/homes/home_1/tasks?assetId=asset_1&status=open",
				"POST https://api.example.com/api/v1/homes/home_1/tasks",
				"GET https://api.example.com/api/v1/tasks/task_1",
				"PATCH https://api.example.com/api/v1/tasks/task_1",
				"DELETE https://api.example.com/api/v1/tasks/task_1",
				"GET https://api.example.com/api/v1/tasks/task_1/reminder-schedule",
				"PUT https://api.example.com/api/v1/tasks/task_1/reminder-schedule",
				"DELETE https://api.example.com/api/v1/tasks/task_1/reminder-schedule",
				"GET https://api.example.com/api/v1/tasks/task_1/completions",
				"POST https://api.example.com/api/v1/tasks/task_1/completions",
			],
		);
		expect(
			requests
				.filter(({ body }) => body !== undefined)
				.map(({ contentType }) => contentType),
		).toStrictEqual(Array.from({ length: 17 }, () => "application/json"));
		expect(
			requests
				.filter(({ body }) => body === undefined)
				.every(({ contentType }) => contentType === null),
		).toBe(true);
	});
});
