import { describe, expect, it } from "vitest";

import type { FetchLike } from "@homestead/sdk";

import { runCli, type ConfigStore } from "../src/cli/run-cli.js";
import type { StoredCliConfig } from "../src/core/stored-config.js";

const createWriter = (): {
	readonly write: (text: string) => void;
	readonly text: () => string;
} => {
	const chunks: string[] = [];
	return {
		write: (text) => {
			chunks.push(text);
		},
		text: () => chunks.join(""),
	};
};

type HttpClient = (request: {
	readonly method: string;
	readonly url: string;
	readonly headers: Readonly<Record<string, string>>;
	readonly bodyText?: string;
}) => Promise<{ readonly status: number; readonly bodyText: string }>;

const fetchFromHttpClient =
	(httpClient: HttpClient): FetchLike =>
	async (input, init) => {
		const headers =
			init?.headers instanceof Headers
				? init.headers
				: new Headers(init?.headers);
		const headerRecord: Record<string, string> = {};
		const authorization = headers.get("authorization");
		const contentType = headers.get("content-type");
		if (authorization !== null) headerRecord["authorization"] = authorization;
		if (contentType !== null) headerRecord["content-type"] = contentType;
		const response = await httpClient({
			method: init?.method ?? "GET",
			url: String(input),
			headers: headerRecord,
			...(init?.body === undefined || init.body === null
				? {}
				: { bodyText: init.body.toString() }),
		});
		return new Response(response.status === 204 ? null : response.bodyText, {
			status: response.status,
		});
	};

const createConfigStore = (
	initialConfig: StoredCliConfig | "invalid" | null = null,
): ConfigStore & { readonly writes: readonly StoredCliConfig[] } => {
	const writes: StoredCliConfig[] = [];
	return {
		path: "/tmp/homestead/config.json",
		read: async () => {
			if (initialConfig === "invalid") {
				return {
					status: "invalid",
					error: { type: "config_error" as const, message: "bad config" },
				};
			}
			return initialConfig === null
				? { status: "missing" }
				: { status: "loaded", config: initialConfig };
		},
		write: async (config) => {
			writes.push(config);
			return { status: "ok", value: undefined };
		},
		clear: async () => ({ status: "ok", value: undefined }),
		writes,
	};
};

describe("runCli", () => {
	it("calls the health API over HTTP and renders success", async () => {
		expect.hasAssertions();
		const requests: string[] = [];
		const httpClient: HttpClient = async (request) => {
			requests.push(request.url);
			return {
				status: 200,
				bodyText: JSON.stringify({ data: { status: "ok" } }),
			};
		};
		const stdout = createWriter();
		const stderr = createWriter();

		await expect(
			runCli({
				args: ["health", "--base-url", "https://api.example.com"],
				env: {},
				fetch: fetchFromHttpClient(httpClient),
				stdout,
				stderr,
			}),
		).resolves.toStrictEqual({ exitCode: 0 });

		expect(requests).toStrictEqual(["https://api.example.com/api/v1/health"]);
		expect(stdout.text()).toBe("ok\n");
		expect(stderr.text()).toBe("");
	});

	it("renders stable JSON envelopes with --json", async () => {
		expect.hasAssertions();
		const httpClient: HttpClient = async () => ({
			status: 200,
			bodyText: JSON.stringify({ data: { status: "ok" } }),
		});
		const stdout = createWriter();
		const stderr = createWriter();

		await expect(
			runCli({
				args: ["health", "--base-url", "https://api.example.com", "--json"],
				env: {},
				fetch: fetchFromHttpClient(httpClient),
				stdout,
				stderr,
			}),
		).resolves.toStrictEqual({ exitCode: 0 });

		expect(JSON.parse(stdout.text()) as unknown).toStrictEqual({
			ok: true,
			command: "health",
			data: { status: "ok" },
		});
		expect(stderr.text()).toBe("");
	});

	it("renders stable JSON auth errors with HOMESTEAD_JSON", async () => {
		expect.hasAssertions();
		const stdout = createWriter();
		const stderr = createWriter();

		await expect(
			runCli({
				args: ["homes", "--base-url", "https://api.example.com"],
				env: { HOMESTEAD_JSON: "1" },
				fetch: fetchFromHttpClient(async () => ({
					status: 200,
					bodyText: "{}",
				})),
				stdout,
				stderr,
			}),
		).resolves.toStrictEqual({ exitCode: 3 });

		expect(stdout.text()).toBe("");
		expect(JSON.parse(stderr.text()) as unknown).toStrictEqual({
			ok: false,
			command: "homes",
			error: {
				code: "auth_required",
				message:
					"This command requires HOMESTEAD_API_TOKEN, stored login, or the --token flag.",
				details: {},
			},
		});
	});

	it("does not call HTTP for authenticated commands without a token", async () => {
		expect.hasAssertions();
		let requestCount = 0;
		const httpClient: HttpClient = async () => {
			requestCount += 1;
			return { status: 200, bodyText: "{}" };
		};
		const stdout = createWriter();
		const stderr = createWriter();

		await expect(
			runCli({
				args: ["homes", "--base-url", "https://api.example.com"],
				env: {},
				fetch: fetchFromHttpClient(httpClient),
				stdout,
				stderr,
			}),
		).resolves.toStrictEqual({ exitCode: 3 });

		expect(requestCount).toBe(0);
		expect(stdout.text()).toBe("");
		expect(stderr.text()).toContain("HOMESTEAD_API_TOKEN");
	});

	it("sends bearer tokens only through the API request header", async () => {
		expect.hasAssertions();
		const authorizations: string[] = [];
		const httpClient: HttpClient = async (request) => {
			const authorization =
				request.headers["authorization"] ?? request.headers["Authorization"];
			if (authorization !== undefined) {
				authorizations.push(authorization);
			}
			return {
				status: 200,
				bodyText: JSON.stringify({ data: { items: [] } }),
			};
		};
		const stdout = createWriter();
		const stderr = createWriter();

		await expect(
			runCli({
				args: ["homes", "--base-url", "https://api.example.com"],
				env: { HOMESTEAD_API_TOKEN: "secret-token" },
				fetch: fetchFromHttpClient(httpClient),
				stdout,
				stderr,
			}),
		).resolves.toStrictEqual({ exitCode: 0 });

		expect(authorizations).toStrictEqual(["Bearer secret-token"]);
		expect(stdout.text()).toBe("No homes found.\n");
		expect(stderr.text()).toBe("");
	});

	it("logs in by verifying the token with the API before storing it", async () => {
		expect.hasAssertions();
		const authorizations: string[] = [];
		const store = createConfigStore();
		const httpClient: HttpClient = async (request) => {
			const authorization =
				request.headers["authorization"] ?? request.headers["Authorization"];
			if (authorization !== undefined) {
				authorizations.push(authorization);
			}
			return {
				status: 200,
				bodyText: JSON.stringify({
					data: {
						user: { id: "user_1", name: "Ada", email: "ada@example.com" },
						homes: [{ id: "home_1", name: "Home", role: "owner" }],
					},
				}),
			};
		};
		const stdout = createWriter();
		const stderr = createWriter();

		await expect(
			runCli({
				args: ["login", "--base-url", "https://api.example.com"],
				env: { HOMESTEAD_API_TOKEN: "secret-token" },
				fetch: fetchFromHttpClient(httpClient),
				stdout,
				stderr,
				configStore: store,
			}),
		).resolves.toStrictEqual({ exitCode: 0 });

		expect(authorizations).toStrictEqual(["Bearer secret-token"]);
		expect(store.writes).toStrictEqual([
			{
				version: 1,
				apiBaseUrl: "https://api.example.com",
				token: "secret-token",
			},
		]);
		expect(stdout.text()).toContain("Logged in as Ada");
		expect(stdout.text()).not.toContain("secret-token");
		expect(stderr.text()).toBe("");
	});

	it("logs in with device approval when no token is provided", async () => {
		expect.hasAssertions();
		const requests: string[] = [];
		const openedUrls: string[] = [];
		const store = createConfigStore();
		let pollCount = 0;
		const httpClient: HttpClient = async (request) => {
			requests.push(
				`${request.method} ${request.url} ${request.bodyText ?? ""}`,
			);
			if (request.url.endsWith("/api/v1/device-login/start")) {
				return {
					status: 200,
					bodyText: JSON.stringify({
						data: {
							deviceCode: "device-secret",
							userCode: "ABCD-EFGH",
							verificationUri: "https://homestead.work/device",
							verificationUriComplete:
								"https://homestead.work/device?code=ABCD-EFGH",
							expiresIn: 600,
							interval: 1,
						},
					}),
				};
			}
			pollCount += 1;
			return pollCount === 1
				? {
						status: 200,
						bodyText: JSON.stringify({
							data: { status: "authorization_pending", interval: 1 },
						}),
					}
				: {
						status: 200,
						bodyText: JSON.stringify({
							data: {
								status: "approved",
								accessToken: "device-token",
								tokenType: "Bearer",
								expiresAt: "2026-09-20T12:00:00.000Z",
								scopes: ["profile:read"],
							},
						}),
					};
		};
		const stdout = createWriter();
		const stderr = createWriter();

		await expect(
			runCli({
				args: ["login", "--base-url", "https://api.example.com"],
				env: {},
				fetch: fetchFromHttpClient(httpClient),
				stdout,
				stderr,
				configStore: store,
				openUrl: async (url) => {
					openedUrls.push(url);
					return { status: "ok", value: undefined };
				},
				sleep: async () => undefined,
			}),
		).resolves.toStrictEqual({ exitCode: 0 });

		expect(openedUrls).toStrictEqual([
			"https://homestead.work/device?code=ABCD-EFGH",
		]);
		expect(requests).toStrictEqual([
			'POST https://api.example.com/api/v1/device-login/start {"clientName":"Homestead CLI","clientType":"cli","requestedScopes":["cli:standard"],"expiresInDays":90}',
			'POST https://api.example.com/api/v1/device-login/token {"deviceCode":"device-secret"}',
			'POST https://api.example.com/api/v1/device-login/token {"deviceCode":"device-secret"}',
		]);
		expect(store.writes).toStrictEqual([
			{
				version: 1,
				apiBaseUrl: "https://api.example.com",
				token: "device-token",
				tokenExpiresAt: "2026-09-20T12:00:00.000Z",
				scopes: ["profile:read"],
			},
		]);
		expect(stdout.text()).toContain("Waiting for approval");
		expect(stdout.text()).not.toContain("device-token");
		expect(stderr.text()).toBe("");
	});

	it("continues device login when opening the browser fails", async () => {
		expect.hasAssertions();
		const store = createConfigStore();
		const httpClient: HttpClient = async (request) => {
			if (request.url.endsWith("/api/v1/device-login/start")) {
				return {
					status: 200,
					bodyText: JSON.stringify({
						data: {
							deviceCode: "device-secret",
							userCode: "ABCD-EFGH",
							verificationUri: "https://homestead.work/device",
							verificationUriComplete:
								"https://homestead.work/device?code=ABCD-EFGH",
							expiresIn: 600,
							interval: 1,
						},
					}),
				};
			}
			return {
				status: 200,
				bodyText: JSON.stringify({
					data: {
						status: "approved",
						accessToken: "device-token",
						tokenType: "Bearer",
						expiresAt: "2026-09-20T12:00:00.000Z",
						scopes: ["profile:read"],
					},
				}),
			};
		};
		const stdout = createWriter();
		const stderr = createWriter();

		await expect(
			runCli({
				args: ["login", "--base-url", "https://api.example.com"],
				env: {},
				fetch: fetchFromHttpClient(httpClient),
				stdout,
				stderr,
				configStore: store,
				openUrl: async () => ({
					status: "error",
					error: {
						type: "config_error",
						message:
							"Unable to open the device login URL automatically: xdg-open missing",
					},
				}),
				sleep: async () => undefined,
			}),
		).resolves.toStrictEqual({ exitCode: 0 });

		expect(stdout.text()).toContain(
			"Open https://homestead.work/device?code=ABCD-EFGH",
		);
		expect(stdout.text()).toContain("Waiting for approval");
		expect(stderr.text()).toContain("Warning: Unable to open");
		expect(stderr.text()).toContain("Open the URL above manually");
		expect(store.writes).toStrictEqual([
			{
				version: 1,
				apiBaseUrl: "https://api.example.com",
				token: "device-token",
				tokenExpiresAt: "2026-09-20T12:00:00.000Z",
				scopes: ["profile:read"],
			},
		]);
	});

	it("keeps polling device login after a slow_down response", async () => {
		expect.hasAssertions();
		const store = createConfigStore();
		let pollCount = 0;
		const httpClient: HttpClient = async (request) => {
			if (request.url.endsWith("/api/v1/device-login/start")) {
				return {
					status: 200,
					bodyText: JSON.stringify({
						data: {
							deviceCode: "device-secret",
							userCode: "ABCD-EFGH",
							verificationUri: "https://homestead.work/device",
							verificationUriComplete:
								"https://homestead.work/device?code=ABCD-EFGH",
							expiresIn: 600,
							interval: 1,
						},
					}),
				};
			}
			pollCount += 1;
			if (pollCount === 1) {
				return {
					status: 429,
					bodyText: JSON.stringify({
						error: {
							type: "domain_error",
							code: "slow_down",
							message: "Device login token is not available.",
						},
					}),
				};
			}
			return {
				status: 200,
				bodyText: JSON.stringify({
					data: {
						status: "approved",
						accessToken: "device-token",
						tokenType: "Bearer",
						expiresAt: "2026-09-20T12:00:00.000Z",
						scopes: ["profile:read"],
					},
				}),
			};
		};
		const stdout = createWriter();
		const stderr = createWriter();

		await expect(
			runCli({
				args: ["login", "--base-url", "https://api.example.com"],
				env: {},
				fetch: fetchFromHttpClient(httpClient),
				stdout,
				stderr,
				configStore: store,
				openUrl: async () => ({ status: "ok", value: undefined }),
				sleep: async () => undefined,
			}),
		).resolves.toStrictEqual({ exitCode: 0 });

		expect(pollCount).toBe(2);
		expect(store.writes).toStrictEqual([
			{
				version: 1,
				apiBaseUrl: "https://api.example.com",
				token: "device-token",
				tokenExpiresAt: "2026-09-20T12:00:00.000Z",
				scopes: ["profile:read"],
			},
		]);
		expect(stderr.text()).toBe("");
	});

	it("uses stored login for API commands", async () => {
		expect.hasAssertions();
		const urls: string[] = [];
		const store = createConfigStore({
			version: 1,
			apiBaseUrl: "https://stored.example.com",
			token: "stored-token",
		});
		const httpClient: HttpClient = async (request) => {
			urls.push(
				`${request.method} ${request.url} ${request.headers["authorization"] ?? request.headers["Authorization"] ?? ""}`,
			);
			return {
				status: 200,
				bodyText: JSON.stringify({ data: { items: [] } }),
			};
		};
		const stdout = createWriter();
		const stderr = createWriter();

		await expect(
			runCli({
				args: ["homes"],
				env: {},
				fetch: fetchFromHttpClient(httpClient),
				stdout,
				stderr,
				configStore: store,
			}),
		).resolves.toStrictEqual({ exitCode: 0 });

		expect(urls).toStrictEqual([
			"GET https://stored.example.com/api/v1/homes Bearer stored-token",
		]);
		expect(stdout.text()).toBe("No homes found.\n");
		expect(stderr.text()).toBe("");
	});

	it("orchestrates resource write commands over HTTP", async () => {
		expect.hasAssertions();
		const requests: string[] = [];
		const httpClient: HttpClient = async (request) => {
			requests.push(
				`${request.method} ${request.url} ${request.bodyText ?? ""}`,
			);
			return {
				status: 201,
				bodyText: JSON.stringify({
					data: {
						asset: {
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
						},
					},
				}),
			};
		};
		const stdout = createWriter();
		const stderr = createWriter();

		await expect(
			runCli({
				args: [
					"create-asset",
					"home_1",
					"--name",
					"Generator",
					"--type",
					"generator",
				],
				env: {
					HOMESTEAD_API_BASE_URL: "https://api.example.com",
					HOMESTEAD_API_TOKEN: "secret-token",
				},
				fetch: fetchFromHttpClient(httpClient),
				stdout,
				stderr,
			}),
		).resolves.toStrictEqual({ exitCode: 0 });

		expect(requests).toStrictEqual([
			'POST https://api.example.com/api/v1/homes/home_1/assets {"name":"Generator","type":"generator"}',
		]);
		expect(stdout.text()).toBe("Created asset Generator (asset_1)\n");
		expect(stderr.text()).toBe("");
	});

	it("orchestrates notification and reminder schedule commands over HTTP", async () => {
		expect.hasAssertions();
		const requests: string[] = [];
		const httpClient: HttpClient = async (request) => {
			requests.push(
				`${request.method} ${request.url} ${request.bodyText ?? ""}`,
			);
			if (request.method === "DELETE") {
				return { status: 204, bodyText: "" };
			}
			if (request.url.endsWith("/notification-integrations/email")) {
				return {
					status: 200,
					bodyText: JSON.stringify({
						data: {
							integration: {
								channel: "email",
								userId: "user_1",
								status: "enabled",
								config: {
									emailAddress: "owner@example.com",
									deliveryMode: "digest",
								},
								createdAt: "2026-06-09T00:00:00.000Z",
								updatedAt: "2026-06-09T00:00:00.000Z",
							},
						},
					}),
				};
			}
			return {
				status: 200,
				bodyText: JSON.stringify({
					data: {
						schedule: {
							taskId: "task_1",
							userId: "user_1",
							channels: ["email"],
							rules: [
								{
									frequency: "weekly",
									startsBeforeDueDays: 14,
									endsBeforeDueDays: 7,
								},
							],
							createdAt: "2026-06-09T00:00:00.000Z",
							updatedAt: "2026-06-09T00:00:00.000Z",
						},
					},
				}),
			};
		};

		const runJsonCommand = async (args: readonly string[]) => {
			const stdout = createWriter();
			const stderr = createWriter();
			await expect(
				runCli({
					args,
					env: {
						HOMESTEAD_API_BASE_URL: "https://api.example.com",
						HOMESTEAD_API_TOKEN: "secret-token",
					},
					fetch: fetchFromHttpClient(httpClient),
					stdout,
					stderr,
				}),
			).resolves.toStrictEqual({ exitCode: 0 });
			expect(stderr.text()).toBe("");
			expect(JSON.parse(stdout.text()) as unknown).toMatchObject({ ok: true });
		};

		await runJsonCommand([
			"set-email-notification",
			"--email",
			"owner@example.com",
			"--json",
		]);
		await runJsonCommand(["task-reminder-schedule", "task_1", "--json"]);
		await runJsonCommand([
			"set-task-reminder-schedule",
			"task_1",
			"--channel",
			"email",
			"--rule",
			"weekly:14:7",
			"--json",
		]);
		await runJsonCommand(["delete-task-reminder-schedule", "task_1", "--json"]);
		await runJsonCommand([
			"delete-notification-integration",
			"email",
			"--json",
		]);

		expect(requests).toStrictEqual([
			'PUT https://api.example.com/api/v1/me/notification-integrations/email {"status":"enabled","config":{"emailAddress":"owner@example.com","deliveryMode":"digest"}}',
			"GET https://api.example.com/api/v1/tasks/task_1/reminder-schedule ",
			'PUT https://api.example.com/api/v1/tasks/task_1/reminder-schedule {"channels":["email"],"rules":[{"frequency":"weekly","startsBeforeDueDays":14,"endsBeforeDueDays":7}]}',
			"DELETE https://api.example.com/api/v1/tasks/task_1/reminder-schedule ",
			"DELETE https://api.example.com/api/v1/me/notification-integrations/email ",
		]);
		expect(JSON.stringify(requests)).not.toContain("secret-token");
	});

	it("registers with setup token from stdin and stores returned API token without printing it", async () => {
		expect.hasAssertions();
		const store = createConfigStore();
		const requests: string[] = [];
		const httpClient: HttpClient = async (request) => {
			requests.push(
				`${request.method} ${request.url} ${request.bodyText ?? ""}`,
			);
			return {
				status: 201,
				bodyText: JSON.stringify({
					data: {
						user: { id: "user_1", name: "Owner" },
						token: "returned-secret-token",
						homes: [],
					},
				}),
			};
		};
		const stdout = createWriter();
		const stderr = createWriter();

		await expect(
			runCli({
				args: [
					"register",
					"--name",
					"Owner",
					"--setup-token-stdin",
					"--base-url",
					"https://api.example.com",
				],
				env: {},
				fetch: fetchFromHttpClient(httpClient),
				stdout,
				stderr,
				stdin: { read: async () => "setup-secret" },
				configStore: store,
			}),
		).resolves.toStrictEqual({ exitCode: 0 });

		expect(requests).toStrictEqual([
			'POST https://api.example.com/api/v1/auth/register {"name":"Owner","setupToken":"setup-secret"}',
		]);
		expect(store.writes).toStrictEqual([
			{
				version: 1,
				apiBaseUrl: "https://api.example.com",
				token: "returned-secret-token",
			},
		]);
		expect(stdout.text()).toBe("Registered and logged in as Owner (user_1)\n");
		expect(stdout.text()).not.toContain("returned-secret-token");
		expect(stderr.text()).toBe("");
	});

	it("redacts newly issued token if post-response config persistence throws", async () => {
		expect.hasAssertions();
		const httpClient: HttpClient = async () => ({
			status: 201,
			bodyText: JSON.stringify({
				data: {
					user: { id: "user_1", name: "Owner" },
					token: "returned-secret-token",
					homes: [],
				},
			}),
		});
		const stdout = createWriter();
		const stderr = createWriter();
		const configStore: ConfigStore = {
			path: "/tmp/homestead/config.json",
			read: async () => ({ status: "missing" }),
			write: async () => {
				throw new Error("cannot persist returned-secret-token");
			},
			clear: async () => ({ status: "ok", value: undefined }),
		};

		await expect(
			runCli({
				args: [
					"register",
					"--name",
					"Owner",
					"--base-url",
					"https://api.example.com",
				],
				env: {},
				fetch: fetchFromHttpClient(httpClient),
				stdout,
				stderr,
				configStore,
			}),
		).resolves.toStrictEqual({ exitCode: 1 });

		expect(stderr.text()).toContain("[redacted]");
		expect(stderr.text()).not.toContain("returned-secret-token");
	});

	it("redacts returned tokens in JSON output", async () => {
		expect.hasAssertions();
		const httpClient: HttpClient = async () => ({
			status: 200,
			bodyText: JSON.stringify({ data: { token: "rotated-secret-token" } }),
		});
		const stdout = createWriter();
		const stderr = createWriter();
		const store = createConfigStore({
			version: 1,
			apiBaseUrl: "https://api.example.com",
			token: "old-token",
		});

		await expect(
			runCli({
				args: ["rotate-token", "--format", "json"],
				env: {},
				fetch: fetchFromHttpClient(httpClient),
				stdout,
				stderr,
				configStore: store,
			}),
		).resolves.toStrictEqual({ exitCode: 0 });

		expect(stdout.text()).toContain("[redacted]");
		expect(stdout.text()).not.toContain("rotated-secret-token");
		expect(stderr.text()).toBe("");
	});

	it("renders actionable default-production network errors", async () => {
		expect.hasAssertions();
		const httpClient: HttpClient = async () => {
			throw new Error("fetch failed");
		};
		const stdout = createWriter();
		const stderr = createWriter();

		await expect(
			runCli({
				args: ["health"],
				env: {},
				fetch: fetchFromHttpClient(httpClient),
				stdout,
				stderr,
			}),
		).resolves.toStrictEqual({ exitCode: 1 });

		expect(stdout.text()).toBe("");
		expect(stderr.text()).toContain("Unable to reach Homestead API");
		expect(stderr.text()).toContain("API base URL: https://api.homestead.work");
		expect(stderr.text()).toContain("Base URL source: default production URL");
		expect(stderr.text()).not.toContain("pnpm dev");
		expect(stderr.text()).toContain("--base-url");
	});

	it("redacts setup token values from register network errors", async () => {
		expect.hasAssertions();
		const httpClient: HttpClient = async () => {
			throw new Error("request failed for setup-secret");
		};
		const stdout = createWriter();
		const stderr = createWriter();

		await expect(
			runCli({
				args: [
					"register",
					"--name",
					"Owner",
					"--setup-token-stdin",
					"--base-url",
					"https://api.example.com",
				],
				env: {},
				fetch: fetchFromHttpClient(httpClient),
				stdout,
				stderr,
				stdin: { read: async () => "setup-secret" },
			}),
		).resolves.toStrictEqual({ exitCode: 1 });

		expect(stdout.text()).toBe("");
		expect(stderr.text()).toContain("[redacted]");
		expect(stderr.text()).not.toContain("setup-secret");
	});

	it("redacts token values from network errors", async () => {
		expect.hasAssertions();
		const httpClient: HttpClient = async () => {
			throw new Error("request failed for secret-token");
		};
		const stdout = createWriter();
		const stderr = createWriter();

		await expect(
			runCli({
				args: ["homes", "--base-url", "https://api.example.com"],
				env: { HOMESTEAD_API_TOKEN: "secret-token" },
				fetch: fetchFromHttpClient(httpClient),
				stdout,
				stderr,
			}),
		).resolves.toStrictEqual({ exitCode: 1 });

		expect(stdout.text()).toBe("");
		expect(stderr.text()).toContain("[redacted]");
		expect(stderr.text()).not.toContain("secret-token");
	});

	it("renders bundled skill content without auth", async () => {
		expect.hasAssertions();
		const stdout = createWriter();
		const stderr = createWriter();

		await expect(
			runCli({
				args: ["skill", "homestead-cli", "--json"],
				env: {},
				stdout,
				stderr,
			}),
		).resolves.toStrictEqual({ exitCode: 0 });

		const output = JSON.parse(stdout.text()) as {
			readonly ok: boolean;
			readonly command: string;
			readonly data: {
				readonly name: string;
				readonly filename: string;
				readonly content: string;
			};
		};
		expect(output.ok).toBe(true);
		expect(output.command).toBe("skill");
		expect(output.data.name).toBe("homestead-cli");
		expect(output.data.content).toContain("Homestead CLI guide for agents");
		expect(stderr.text()).toBe("");
	});

	it("renders skill content without reading API config", async () => {
		expect.hasAssertions();
		const stdout = createWriter();
		const stderr = createWriter();

		await expect(
			runCli({
				args: ["skill", "list", "--json"],
				env: { HOMESTEAD_API_BASE_URL: "not a url" },
				stdout,
				stderr,
				configStore: createConfigStore("invalid"),
			}),
		).resolves.toStrictEqual({ exitCode: 0 });

		expect(JSON.parse(stdout.text()) as unknown).toMatchObject({
			ok: true,
			command: "skill",
		});
		expect(stderr.text()).toBe("");
	});

	it("renders actionable unknown command help without requiring config or auth", async () => {
		expect.hasAssertions();
		let requestCount = 0;
		const stdout = createWriter();
		const stderr = createWriter();

		await expect(
			runCli({
				args: ["login--help"],
				env: {},
				fetch: fetchFromHttpClient(async () => {
					requestCount += 1;
					return { status: 200, bodyText: "{}" };
				}),
				stdout,
				stderr,
				configStore: createConfigStore("invalid"),
			}),
		).resolves.toStrictEqual({ exitCode: 2 });

		expect(requestCount).toBe(0);
		expect(stdout.text()).toBe("");
		expect(stderr.text()).toContain("Unknown command: login--help");
		expect(stderr.text()).toContain("homestead login --help");
	});

	it("renders Commander help to stdout without requiring config or auth", async () => {
		expect.hasAssertions();
		let requestCount = 0;
		const httpClient: HttpClient = async () => {
			requestCount += 1;
			return { status: 200, bodyText: "{}" };
		};
		const stdout = createWriter();
		const stderr = createWriter();

		await expect(
			runCli({
				args: [],
				env: {},
				fetch: fetchFromHttpClient(httpClient),
				stdout,
				stderr,
				configStore: createConfigStore("invalid"),
			}),
		).resolves.toStrictEqual({ exitCode: 0 });

		expect(requestCount).toBe(0);
		expect(stdout.text()).toContain("Usage: homestead [options] [command]");
		expect(stdout.text()).toContain("reminder-deliveries");
		expect(stderr.text()).toBe("");
	});

	it("ignores invalid stored config when explicit credentials are supplied", async () => {
		expect.hasAssertions();
		const store = createConfigStore("invalid");
		const httpClient: HttpClient = async () => ({
			status: 200,
			bodyText: JSON.stringify({ data: { items: [] } }),
		});
		const stdout = createWriter();
		const stderr = createWriter();

		await expect(
			runCli({
				args: ["homes", "--base-url", "https://api.example.com"],
				env: { HOMESTEAD_API_TOKEN: "explicit-token" },
				fetch: fetchFromHttpClient(httpClient),
				stdout,
				stderr,
				configStore: store,
			}),
		).resolves.toStrictEqual({ exitCode: 0 });

		expect(stdout.text()).toBe("No homes found.\n");
		expect(stderr.text()).toBe("");
	});
});
