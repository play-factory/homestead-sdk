import { describe, expect, it } from "vitest";

import { createHomesteadApiClient, type FetchLike } from "../src/index.js";

describe("Homestead API client stream methods", () => {
	it("posts assistant messages to the streaming endpoint and returns the final event", async () => {
		expect.hasAssertions();
		const requests: string[] = [];
		const fetch: FetchLike = async (input, init) => {
			requests.push(
				`${String(input)} ${new Headers(init?.headers).get("authorization") ?? ""}`,
			);
			return new Response(
				[
					'data: {"type":"text_delta","delta":"Hi"}',
					"",
					'data: {"type":"final","data":{"kind":"answer","message":"Hi"}}',
					"",
				].join("\n"),
				{ status: 200, headers: { "content-type": "text/event-stream" } },
			);
		};
		const client = createHomesteadApiClient({
			baseUrl: "https://api.example.com",
			auth: { type: "bearer", token: "redacted-token" },
			fetch,
		});

		await expect(
			client.postAgentMessageStream({ homeId: "home_1", message: "hello" }),
		).resolves.toStrictEqual({
			status: "ok",
			value: { data: { kind: "answer", message: "Hi" } },
		});
		expect(requests).toStrictEqual([
			"https://api.example.com/api/v1/agent/messages/stream Bearer redacted-token",
		]);
	});

	it("maps assistant stream error events to API errors", async () => {
		expect.hasAssertions();
		const fetch: FetchLike = async () =>
			new Response(
				'data: {"type":"error","code":"agent_model_failed","message":"The assistant failed safely."}\n\n',
				{ status: 200, headers: { "content-type": "text/event-stream" } },
			);
		const client = createHomesteadApiClient({
			baseUrl: "https://api.example.com",
			auth: { type: "bearer", token: "redacted-token" },
			fetch,
		});

		await expect(
			client.postAgentMessageStream({ homeId: "home_1", message: "hello" }),
		).resolves.toStrictEqual({
			status: "error",
			error: {
				type: "api_error",
				status: 500,
				code: "agent_model_failed",
				message: "The assistant failed safely.",
			},
		});
	});
	it.each([
		{ name: "invalid JSON frame", body: "data: not-json\n\n" },
		{ name: "unknown event type", body: 'data: {"type":"tool_execute"}\n\n' },
		{
			name: "missing final event",
			body: 'data: {"type":"text_delta","delta":"Hi"}\n\n',
		},
		{ name: "non-data frame", body: "event: message\n\n" },
	])("maps malformed assistant stream responses to safe contract errors: $name", async ({
		body,
	}) => {
		expect.hasAssertions();
		const fetch: FetchLike = async () =>
			new Response(body, {
				status: 200,
				headers: { "content-type": "text/event-stream" },
			});
		const client = createHomesteadApiClient({
			baseUrl: "https://api.example.com",
			auth: { type: "bearer", token: "redacted-token" },
			fetch,
		});

		const result = await client.postAgentMessageStream({
			homeId: "home_1",
			message: "hello",
		});

		const message = body.includes("text_delta")
			? "Assistant stream ended without a final event."
			: "Assistant stream response was invalid.";
		expect(result).toStrictEqual({
			status: "error",
			error: { type: "contract_error", message },
		});
		expect(message).not.toContain(body);
	});
});
