import type { CreateTaskRequestBody } from "@homestead/sdk";

import type { CliError } from "./errors.js";
import { error, ok, type Result } from "./result.js";

export type TaskRecurrenceInput = NonNullable<
	CreateTaskRequestBody["recurrence"]
>;

const usageError = <T>(message: string): Result<T, CliError> =>
	error({ type: "usage_error", message });

const parsePositiveInteger = (value: string): number | null => {
	const parsed = Number.parseInt(value, 10);
	return Number.isInteger(parsed) && String(parsed) === value && parsed >= 1
		? parsed
		: null;
};

export const parseTaskRecurrenceInput = (input: {
	readonly repeatEvery?: string;
	readonly repeatUnit?: string;
}): Result<TaskRecurrenceInput | undefined, CliError> => {
	if (input.repeatEvery === undefined && input.repeatUnit === undefined) {
		return ok(undefined);
	}
	if (input.repeatEvery === undefined || input.repeatUnit === undefined) {
		return usageError("Use --repeat-every together with --repeat-unit.");
	}
	const interval = parsePositiveInteger(input.repeatEvery);
	if (interval === null) {
		return usageError("--repeat-every must be a positive integer.");
	}
	switch (input.repeatUnit) {
		case "day":
		case "days":
			return ok({ frequency: "daily", interval });
		case "week":
		case "weeks":
			return ok({ frequency: "weekly", interval });
		case "month":
		case "months":
			return ok({ frequency: "monthly", interval });
		case "year":
		case "years":
			return ok({ frequency: "yearly", interval });
		default:
			return usageError("--repeat-unit must be day, week, month, or year.");
	}
};
