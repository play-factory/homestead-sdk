import { describe, expect, it } from "vitest";

import { parseReminderScheduleInput } from "../src/core/reminder-schedule-input.js";

describe("reminder schedule CLI input", () => {
	it("builds the email default schedule", () => {
		expect.hasAssertions();

		expect(parseReminderScheduleInput({ emailDefault: true })).toStrictEqual({
			status: "ok",
			value: {
				channels: ["email"],
				rules: [
					{
						frequency: "weekly",
						startsBeforeDueDays: 14,
						endsBeforeDueDays: 7,
					},
					{ frequency: "daily", startsBeforeDueDays: 6, endsBeforeDueDays: 0 },
				],
			},
		});
	});

	it("parses explicit channels and rules", () => {
		expect.hasAssertions();

		expect(
			parseReminderScheduleInput({
				channels: ["email"],
				rules: ["weekly:14:7", "daily:6:0"],
			}),
		).toStrictEqual({
			status: "ok",
			value: {
				channels: ["email"],
				rules: [
					{
						frequency: "weekly",
						startsBeforeDueDays: 14,
						endsBeforeDueDays: 7,
					},
					{ frequency: "daily", startsBeforeDueDays: 6, endsBeforeDueDays: 0 },
				],
			},
		});
	});

	it("rejects ambiguous or malformed input", () => {
		expect.hasAssertions();

		expect(
			parseReminderScheduleInput({
				channels: ["email"],
				rules: ["weekly:14:7"],
				emailDefault: true,
			}),
		).toStrictEqual({
			status: "error",
			error: {
				type: "usage_error",
				message: "Cannot combine --email-default with --channel or --rule.",
			},
		});
		expect(
			parseReminderScheduleInput({ channels: ["sms"], rules: ["weekly:14:7"] }),
		).toStrictEqual({
			status: "error",
			error: {
				type: "usage_error",
				message: "Reminder channel must be email or telegram.",
			},
		});
		expect(
			parseReminderScheduleInput({
				channels: ["email"],
				rules: ["monthly:1:0"],
			}),
		).toStrictEqual({
			status: "error",
			error: {
				type: "usage_error",
				message: "Reminder rule frequency must be daily or weekly.",
			},
		});
	});
});
