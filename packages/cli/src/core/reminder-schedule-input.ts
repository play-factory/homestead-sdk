import type { PutTaskReminderScheduleRequestBody } from "@homestead/sdk";

import type { CliError } from "./errors.js";
import { error, ok, type Result } from "./result.js";

export type ReminderChannelInput = "email" | "telegram";
export type ReminderFrequencyInput = "daily" | "weekly";
export type ReminderRuleInput = {
	readonly frequency: ReminderFrequencyInput;
	readonly startsBeforeDueDays: number;
	readonly endsBeforeDueDays: number;
};

export type ReminderScheduleCliInput = {
	readonly channels?: readonly string[];
	readonly rules?: readonly string[];
	readonly emailDefault?: boolean;
};

const usageError = <T>(message: string): Result<T, CliError> =>
	error({ type: "usage_error", message });

const emailDefaultSchedule = (): PutTaskReminderScheduleRequestBody => ({
	channels: ["email"],
	rules: [
		{ frequency: "weekly", startsBeforeDueDays: 14, endsBeforeDueDays: 7 },
		{ frequency: "daily", startsBeforeDueDays: 6, endsBeforeDueDays: 0 },
	],
});

export const parseReminderChannel = (
	value: string,
): Result<ReminderChannelInput, CliError> => {
	if (value === "email" || value === "telegram") return ok(value);
	return usageError("Reminder channel must be email or telegram.");
};

const parseNonNegativeInteger = (value: string): number | null => {
	const parsed = Number.parseInt(value, 10);
	return Number.isInteger(parsed) && String(parsed) === value && parsed >= 0
		? parsed
		: null;
};

export const parseReminderRule = (
	value: string,
): Result<ReminderRuleInput, CliError> => {
	const [frequency, startsBeforeDueDays, endsBeforeDueDays, extra] =
		value.split(":");
	if (
		extra !== undefined ||
		frequency === undefined ||
		startsBeforeDueDays === undefined ||
		endsBeforeDueDays === undefined
	) {
		return usageError(
			"Reminder rule must use frequency:startsBeforeDueDays:endsBeforeDueDays, for example weekly:14:7.",
		);
	}
	if (frequency !== "daily" && frequency !== "weekly") {
		return usageError("Reminder rule frequency must be daily or weekly.");
	}
	const start = parseNonNegativeInteger(startsBeforeDueDays);
	const end = parseNonNegativeInteger(endsBeforeDueDays);
	if (start === null || end === null) {
		return usageError(
			"Reminder rule day offsets must be non-negative integers.",
		);
	}
	return ok({ frequency, startsBeforeDueDays: start, endsBeforeDueDays: end });
};

const parseChannels = (
	values: readonly string[],
): Result<ReminderChannelInput[], CliError> => {
	const channels: ReminderChannelInput[] = [];
	for (const value of values) {
		const parsed = parseReminderChannel(value);
		if (parsed.status === "error") return parsed;
		channels.push(parsed.value);
	}
	return ok(channels);
};

const parseRules = (
	values: readonly string[],
): Result<ReminderRuleInput[], CliError> => {
	const rules: ReminderRuleInput[] = [];
	for (const value of values) {
		const parsed = parseReminderRule(value);
		if (parsed.status === "error") return parsed;
		rules.push(parsed.value);
	}
	return ok(rules);
};

export const parseReminderScheduleInput = (
	input: ReminderScheduleCliInput,
): Result<PutTaskReminderScheduleRequestBody, CliError> => {
	const channels = input.channels ?? [];
	const rules = input.rules ?? [];
	if (input.emailDefault === true) {
		return channels.length > 0 || rules.length > 0
			? usageError("Cannot combine --email-default with --channel or --rule.")
			: ok(emailDefaultSchedule());
	}
	if (channels.length === 0) {
		return usageError("At least one --channel is required.");
	}
	if (rules.length === 0) {
		return usageError("At least one --rule is required.");
	}
	const parsedChannels = parseChannels(channels);
	if (parsedChannels.status === "error") return parsedChannels;
	const parsedRules = parseRules(rules);
	if (parsedRules.status === "error") return parsedRules;
	return ok({ channels: parsedChannels.value, rules: parsedRules.value });
};
