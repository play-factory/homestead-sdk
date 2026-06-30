import { describe, expect, it } from "vitest";

import { createHomesteadApiClient, type FetchLike } from "../src/index.js";

const jsonResponse = (status: number, body: unknown): Response =>
	new Response(JSON.stringify(body), {
		status,
		headers: { "Content-Type": "application/json" },
	});

describe("homestead API client", () => {
	it("executes typed health, me, and homes requests", async () => {
		expect.hasAssertions();
		const requests: string[] = [];
		const fetch: FetchLike = async (input, init) => {
			requests.push(
				`${init?.method ?? "GET"} ${String(input)} ${init?.headers instanceof Headers ? init.headers.get("Authorization") : ""}`,
			);
			if (String(input).endsWith("/api/v1/health")) {
				return jsonResponse(200, { data: { status: "ok" } });
			}
			if (String(input).endsWith("/api/v1/auth/me")) {
				return jsonResponse(200, {
					data: { user: { id: "user_1", name: "Owner" }, homes: [] },
				});
			}
			if (init?.method === "POST" && String(input).endsWith("/api/v1/homes")) {
				return jsonResponse(201, {
					data: { home: { id: "home_2", name: "Cypress Bay", role: "owner" } },
				});
			}
			return jsonResponse(200, {
				data: { items: [{ id: "home_1", name: "Home", role: "owner" }] },
			});
		};
		const client = createHomesteadApiClient({
			baseUrl: "https://api.example.com",
			auth: { type: "bearer", token: "secret-token" },
			fetch,
		});

		await expect(client.getHealth()).resolves.toStrictEqual({
			status: "ok",
			value: { data: { status: "ok" } },
		});
		await expect(client.getCurrentPrincipal()).resolves.toStrictEqual({
			status: "ok",
			value: { data: { user: { id: "user_1", name: "Owner" }, homes: [] } },
		});
		await expect(client.listHomes()).resolves.toStrictEqual({
			status: "ok",
			value: {
				data: { items: [{ id: "home_1", name: "Home", role: "owner" }] },
			},
		});
		await expect(client.createHome({ name: "Cypress Bay" })).resolves.toStrictEqual({
			status: "ok",
			value: {
				data: { home: { id: "home_2", name: "Cypress Bay", role: "owner" } },
			},
		});
		expect(requests).toStrictEqual([
			"GET https://api.example.com/api/v1/health Bearer secret-token",
			"GET https://api.example.com/api/v1/auth/me Bearer secret-token",
			"GET https://api.example.com/api/v1/homes Bearer secret-token",
			"POST https://api.example.com/api/v1/homes Bearer secret-token",
		]);
	});

	it("lists and uploads asset files without JSON content type", async () => {
		expect.hasAssertions();
		const requests: string[] = [];
		const fetch: FetchLike = async (input, init) => {
			const headers =
				init?.headers instanceof Headers ? init.headers : new Headers();
			requests.push(
				`${init?.method ?? "GET"} ${String(input)} ${headers.get("Content-Type") ?? "no-content-type"} ${init?.body instanceof FormData ? "form-data" : "no-form-data"}`,
			);
			const body = {
				id: "asset_file_1",
				homeId: "home_1",
				assetId: "asset_1",
				kind: "document",
				fileName: "manual.pdf",
				contentType: "application/pdf",
				sizeBytes: 5,
				uploadedAt: "2026-05-28T10:00:00.000Z",
				etag: null,
				createdAt: "2026-05-28T10:00:00.000Z",
				updatedAt: "2026-05-28T10:00:00.000Z",
			};
			return String(input).includes("/asset-files")
				? jsonResponse(200, { data: { items: [body] } })
				: jsonResponse(201, { data: { file: body } });
		};
		const client = createHomesteadApiClient({
			baseUrl: "https://api.example.com",
			auth: { type: "bearer", token: "secret-token" },
			fetch,
		});

		expect(
			(
				await client.listAssetFiles({
					homeId: "home_1",
					query: { assetId: "asset_1", kind: "document" },
				})
			).status,
		).toBe("ok");
		expect(
			(
				await client.uploadAssetFile({
					assetId: "asset_1",
					body: {
						kind: "document",
						file: new Blob([new Uint8Array([1])], { type: "application/pdf" }),
						fileName: "manual.pdf",
					},
				})
			).status,
		).toBe("ok");
		expect(requests).toStrictEqual([
			"GET https://api.example.com/api/v1/homes/home_1/asset-files?assetId=asset_1&kind=document no-content-type no-form-data",
			"POST https://api.example.com/api/v1/assets/asset_1/files no-content-type form-data",
		]);
	});

	it("posts agent messages and approves or rejects plans", async () => {
		expect.hasAssertions();
		const requests: string[] = [];
		const fetch: FetchLike = async (input, init) => {
			requests.push(
				`${init?.method ?? "GET"} ${String(input)} ${String(init?.body ?? "")}`,
			);
			if (String(input).endsWith("/api/v1/agent/messages")) {
				return jsonResponse(200, {
					data: { kind: "answer", message: "I found 0 tasks." },
				});
			}
			if (String(input).endsWith("/api/v1/agent/plans/plan_1/reject")) {
				return jsonResponse(200, {
					data: {
						kind: "rejected",
						plan: {
							id: "plan_1",
							homeId: "home_1",
							status: "rejected",
							actions: [{ kind: "list_tasks", homeId: "home_1" }],
							summary: "Rejected",
							createdAt: "2026-06-10T00:00:00.000Z",
							updatedAt: "2026-06-10T00:00:00.000Z",
						},
					},
				});
			}
			return jsonResponse(200, {
				data: {
					kind: "executed",
					plan: {
						id: "plan_1",
						homeId: "home_1",
						status: "executed",
						actions: [{ kind: "list_tasks", homeId: "home_1" }],
						summary: "Done",
						createdAt: "2026-06-10T00:00:00.000Z",
						updatedAt: "2026-06-10T00:00:00.000Z",
					},
					results: [],
				},
			});
		};
		const client = createHomesteadApiClient({
			baseUrl: "https://api.example.com",
			auth: { type: "bearer", token: "secret-token" },
			fetch,
		});

		await expect(
			client.postAgentMessage({
				homeId: "home_1",
				message: "tasks",
				conversationContext: {
					recentMessages: [{ role: "assistant", text: "I found 1 task." }],
					recentReferences: [
						{
							label: "first task",
							kind: "task",
							id: "task_1",
							title: "Clean gutters",
						},
					],
					recentPlanEvents: [],
				},
			}),
		).resolves.toStrictEqual({
			status: "ok",
			value: { data: { kind: "answer", message: "I found 0 tasks." } },
		});
		await expect(
			client.approveAgentPlan({ planId: "plan_1" }),
		).resolves.toMatchObject({
			status: "ok",
			value: { data: { kind: "executed" } },
		});
		await expect(
			client.rejectAgentPlan({ planId: "plan_1" }),
		).resolves.toMatchObject({
			status: "ok",
			value: { data: { kind: "rejected" } },
		});
		expect(requests).toStrictEqual([
			'POST https://api.example.com/api/v1/agent/messages {"homeId":"home_1","message":"tasks","conversationContext":{"recentMessages":[{"role":"assistant","text":"I found 1 task."}],"recentReferences":[{"label":"first task","kind":"task","id":"task_1","title":"Clean gutters"}],"recentPlanEvents":[]}}',
			"POST https://api.example.com/api/v1/agent/plans/plan_1/approve ",
			"POST https://api.example.com/api/v1/agent/plans/plan_1/reject ",
		]);
	});

	it("maps transport, API, and contract errors", async () => {
		expect.hasAssertions();
		const throwingFetch: FetchLike = async () => {
			throw new Error("network failed");
		};
		await expect(
			createHomesteadApiClient({
				baseUrl: "https://api.example.com",
				auth: { type: "anonymous" },
				fetch: throwingFetch,
			}).getHealth(),
		).resolves.toStrictEqual({
			status: "error",
			error: { type: "transport_error", message: "network failed" },
		});

		const apiErrorFetch: FetchLike = async () =>
			jsonResponse(401, {
				error: {
					type: "auth",
					code: "invalid_token",
					message: "Invalid token.",
				},
				meta: { requestId: "req_1" },
			});
		await expect(
			createHomesteadApiClient({
				baseUrl: "https://api.example.com",
				auth: { type: "anonymous" },
				fetch: apiErrorFetch,
			}).getHealth(),
		).resolves.toStrictEqual({
			status: "error",
			error: {
				type: "api_error",
				status: 401,
				code: "invalid_token",
				message: "Invalid token.",
				requestId: "req_1",
			},
		});

		const contractErrorFetch: FetchLike = async () =>
			jsonResponse(200, { data: { nope: true } });
		await expect(
			createHomesteadApiClient({
				baseUrl: "https://api.example.com",
				auth: { type: "anonymous" },
				fetch: contractErrorFetch,
			}).getHealth(),
		).resolves.toStrictEqual({
			status: "error",
			error: {
				type: "contract_error",
				message: "Unexpected getHealth response.",
			},
		});
	});
});
