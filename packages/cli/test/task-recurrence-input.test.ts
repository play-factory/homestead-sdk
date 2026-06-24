import { describe, expect, it } from "vitest";

import { parseTaskRecurrenceInput } from "../src/core/task-recurrence-input.js";

describe("task recurrence CLI input", () => {
	it("parses common cadence flags", () => {
		expect.hasAssertions();

		expect(
			parseTaskRecurrenceInput({ repeatEvery: "2", repeatUnit: "weeks" }),
		).toStrictEqual({
			status: "ok",
			value: { frequency: "weekly", interval: 2 },
		});
		expect(
			parseTaskRecurrenceInput({ repeatEvery: "1", repeatUnit: "month" }),
		).toStrictEqual({
			status: "ok",
			value: { frequency: "monthly", interval: 1 },
		});
	});

	it("rejects incomplete recurrence flags", () => {
		expect.hasAssertions();

		expect(parseTaskRecurrenceInput({ repeatEvery: "2" })).toStrictEqual({
			status: "error",
			error: {
				type: "usage_error",
				message: "Use --repeat-every together with --repeat-unit.",
			},
		});
	});
});
