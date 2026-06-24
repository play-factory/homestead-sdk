import { describe, expect, it } from "vitest";

import {
	buildJsonHeaders,
	joinApiUrl,
	normalizeApiBaseUrl,
	parseHttpResponse,
} from "../src/index.js";
import { z } from "zod";

describe("api-client core helpers", () => {
	it("normalizes valid base URLs", () => {
		expect.hasAssertions();
		expect(normalizeApiBaseUrl("https://api.example.com/")).toStrictEqual({
			status: "ok",
			value: "https://api.example.com",
		});
	});

	it("rejects invalid base URLs", () => {
		expect.hasAssertions();
		expect(normalizeApiBaseUrl("not a url")).toStrictEqual({
			status: "error",
			error: {
				type: "configuration_error",
				message: "API base URL must be a valid URL.",
			},
		});
	});

	it("joins URLs with encoded path params and deterministic query params", () => {
		expect.hasAssertions();
		expect(
			joinApiUrl("https://api.example.com", "/api/v1/homes/{homeId}/assets", {
				path: { homeId: "home 1" },
				query: { status: "active", type: "generator", empty: undefined },
			}),
		).toBe(
			"https://api.example.com/api/v1/homes/home%201/assets?status=active&type=generator",
		);
	});

	it("parses 204 no-content responses", () => {
		expect.hasAssertions();
		expect(
			parseHttpResponse(
				{ status: 204, bodyText: "" },
				z.void(),
				"deleteTaskReminderSchedule",
			),
		).toStrictEqual({ status: "ok", value: undefined });
	});

	it("builds JSON headers with optional bearer auth", () => {
		expect.hasAssertions();
		expect(
			buildJsonHeaders({ auth: { type: "anonymous" }, includeBody: false }),
		).toStrictEqual({
			Accept: "application/json",
		});
		expect(
			buildJsonHeaders({
				auth: { type: "bearer", token: "token" },
				includeBody: true,
			}),
		).toStrictEqual({
			Accept: "application/json",
			Authorization: "Bearer token",
			"Content-Type": "application/json",
		});
	});
});
