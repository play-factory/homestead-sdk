import { Command, CommanderError, InvalidArgumentError } from "commander";
import { z } from "zod";

import type { BulkApplyRequestBody } from "@homestead/sdk";
import type { CliCommand, JsonObject } from "../core/commands.js";
import type { CliError } from "../core/errors.js";
import { parseReminderScheduleInput } from "../core/reminder-schedule-input.js";
import { error, ok, type Result } from "../core/result.js";
import { parseTaskRecurrenceInput } from "../core/task-recurrence-input.js";

export type ParsedCli =
	| {
			readonly command: CliCommand;
			readonly flags: {
				readonly baseUrl?: string;
				readonly token?: string;
				readonly format?: string;
				readonly json?: boolean;
			};
	  }
	| { readonly helpText: string };

type GlobalOptions = {
	readonly baseUrl?: string;
	readonly token?: string;
	readonly format?: string;
	readonly json?: boolean;
};

type RegisterOptions = {
	readonly name?: string;
	readonly email?: string;
	readonly setupTokenStdin?: boolean;
};

type NotificationIntegrationOptions = {
	readonly email?: string;
	readonly status?: string;
	readonly deliveryMode?: string;
};

type ReminderDeliveryOptions = {
	readonly status?: string;
	readonly channel?: string;
	readonly taskId?: string;
	readonly limit?: number;
};

type TaskReminderScheduleOptions = {
	readonly channel?: readonly string[];
	readonly rule?: readonly string[];
	readonly emailDefault?: boolean;
};

type TemplateOptions = {
	readonly kind?: string;
	readonly category?: string;
};

type InstantiateTemplateOptions = {
	readonly assetId?: string;
	readonly dueAt?: string;
};

type BulkOptions = { readonly commandsJson?: string };

type NotesOptions = { readonly notes?: string };

type AssetListOptions = {
	readonly type?: string;
	readonly status?: string;
};

type CreateAssetOptions = {
	readonly name?: string;
	readonly type?: string;
	readonly parentAssetId?: string;
	readonly notes?: string;
	readonly profileJson?: string;
};

type UpdateAssetOptions = {
	readonly name?: string;
	readonly type?: string;
	readonly parentAssetId?: string;
	readonly clearParentAssetId?: boolean;
	readonly notes?: string;
	readonly clearNotes?: boolean;
	readonly profileJson?: string;
};

type TaskListOptions = {
	readonly assetId?: string;
	readonly status?: string;
};

type CreateTaskOptions = {
	readonly title?: string;
	readonly assetId?: string;
	readonly notes?: string;
	readonly dueAt?: string;
	readonly repeatEvery?: string;
	readonly repeatUnit?: string;
};

type UpdateTaskOptions = {
	readonly title?: string;
	readonly assetId?: string;
	readonly clearAssetId?: boolean;
	readonly notes?: string;
	readonly clearNotes?: boolean;
	readonly dueAt?: string;
	readonly clearDueAt?: boolean;
	readonly repeatEvery?: string;
	readonly repeatUnit?: string;
	readonly clearRecurrence?: boolean;
	readonly status?: string;
};

const knownCommands = [
	"login",
	"register",
	"revoke-token",
	"rotate-token",
	"health",
	"me",
	"homes",
	"memberships",
	"summary",
	"backup-export",
	"bulk-preview",
	"bulk-apply",
	"notification-integrations",
	"set-email-notification",
	"delete-notification-integration",
	"reminder-deliveries",
	"task-reminder-schedule",
	"set-task-reminder-schedule",
	"delete-task-reminder-schedule",
	"templates",
	"template",
	"recommendations",
	"instantiate-template",
	"complete-task",
	"assets",
	"create-asset",
	"asset",
	"update-asset",
	"archive-asset",
	"tasks",
	"create-task",
	"task",
	"update-task",
	"task-completions",
	"archive-task",
	"skill",
] as const;

const defaultUsage = `Usage: homestead <${knownCommands.join("|")}>`;

const usageError = <T>(message: string): Result<T, CliError> =>
	error({ type: "usage_error", message });

const required = <T>(
	value: T | undefined,
	usage: string,
): Result<T, CliError> => (value === undefined ? usageError(usage) : ok(value));

type ParsedJsonScalar = string | number | boolean | null;
type ParsedJsonValue =
	| ParsedJsonScalar
	| ParsedJsonValue[]
	| { readonly [key: string]: ParsedJsonValue };

const JsonValueSchema: z.ZodType<ParsedJsonValue> = z.lazy(() =>
	z.union([
		z.string(),
		z.number(),
		z.boolean(),
		z.null(),
		z.array(JsonValueSchema),
		z.record(z.string(), JsonValueSchema),
	]),
);
const JsonObjectSchema = z.record(z.string(), JsonValueSchema);

const BulkAssetReferenceSchema = z.discriminatedUnion("type", [
	z.object({ type: z.literal("existing"), assetId: z.string().trim().min(1) }),
	z.object({ type: z.literal("created"), clientRef: z.string().trim().min(1) }),
]);

const BulkApplyRequestBodySchema = z.object({
	commands: z
		.array(
			z.discriminatedUnion("kind", [
				z.object({
					kind: z.literal("create_asset"),
					clientRef: z.string().trim().min(1).optional(),
					body: z.object({
						parent: BulkAssetReferenceSchema.optional(),
						name: z.string().trim().min(1),
						type: z.string().trim().min(1),
						profile: JsonObjectSchema.optional(),
						notes: z.string().trim().min(1).optional(),
					}),
				}),
				z.object({
					kind: z.literal("create_task"),
					clientRef: z.string().trim().min(1).optional(),
					body: z.object({
						asset: BulkAssetReferenceSchema.optional(),
						title: z.string().trim().min(1),
						notes: z.string().trim().min(1).optional(),
						dueAt: z.string().trim().min(1).optional(),
						recurrence: z
							.object({
								frequency: z.enum(["daily", "weekly", "monthly", "yearly"]),
								interval: z.number().int().min(1),
							})
							.optional(),
					}),
				}),
			]),
		)
		.min(1)
		.max(100),
});

type ParsedBulkApplyRequestBody = z.infer<typeof BulkApplyRequestBodySchema>;

const normalizeBulkCommand = (
	command: ParsedBulkApplyRequestBody["commands"][number],
): BulkApplyRequestBody["commands"][number] =>
	command.kind === "create_asset"
		? {
				kind: "create_asset",
				...(command.clientRef === undefined
					? {}
					: { clientRef: command.clientRef }),
				body: {
					...(command.body.parent === undefined
						? {}
						: { parent: command.body.parent }),
					name: command.body.name,
					type: command.body.type,
					...(command.body.profile === undefined
						? {}
						: { profile: command.body.profile }),
					...(command.body.notes === undefined
						? {}
						: { notes: command.body.notes }),
				},
			}
		: {
				kind: "create_task",
				...(command.clientRef === undefined
					? {}
					: { clientRef: command.clientRef }),
				body: {
					...(command.body.asset === undefined
						? {}
						: { asset: command.body.asset }),
					title: command.body.title,
					...(command.body.notes === undefined
						? {}
						: { notes: command.body.notes }),
					...(command.body.dueAt === undefined
						? {}
						: { dueAt: command.body.dueAt }),
					...(command.body.recurrence === undefined
						? {}
						: { recurrence: command.body.recurrence }),
				},
			};

const normalizeBulkBody = (
	body: ParsedBulkApplyRequestBody,
): BulkApplyRequestBody => ({
	commands: body.commands.map(normalizeBulkCommand),
});

const parseBulkCommandsJson = (
	value: string | undefined,
): Result<BulkApplyRequestBody, CliError> => {
	if (value === undefined) {
		return usageError("--commands-json is required.");
	}
	try {
		const parsed = BulkApplyRequestBodySchema.parse(JSON.parse(value));
		return ok(normalizeBulkBody(parsed));
	} catch {
		return usageError("--commands-json must be valid Homestead bulk JSON.");
	}
};

const parseProfileJson = (
	value: string | undefined,
): Result<JsonObject | undefined, CliError> => {
	if (value === undefined) return ok(undefined);
	try {
		const parsed = JSON.parse(value) as unknown;
		if (
			parsed === null ||
			Array.isArray(parsed) ||
			typeof parsed !== "object"
		) {
			return usageError("--profile-json must be a JSON object.");
		}
		return ok(parsed as JsonObject);
	} catch {
		return usageError("--profile-json must be valid JSON.");
	}
};

const collectValues = (
	value: string,
	previous: readonly string[],
): string[] => [...previous, value];

const parseLimit = (value: string): number => {
	const parsed = Number.parseInt(value, 10);
	if (!Number.isInteger(parsed) || parsed < 1 || String(parsed) !== value) {
		throw new InvalidArgumentError("Limit must be a positive integer.");
	}
	return parsed;
};

const extractUnknownCommand = (message: string): string | null =>
	message.match(/'([^']+)'/)?.[1] ?? null;

const buildUnknownCommandMessage = (token: string | null): string => {
	if (token === null) return `${defaultUsage}\n\nRun:\n  homestead --help`;
	const possibleCommand = token.endsWith("--help")
		? token.slice(0, -"--help".length)
		: "";
	const suggestion = knownCommands.some(
		(commandName) => commandName === possibleCommand,
	)
		? `\n\nDid you mean?\n  homestead ${possibleCommand} --help`
		: "";
	return `Unknown command: ${token}${suggestion}\n\nRun:\n  homestead --help`;
};

const normalizeCommanderMessage = (
	commanderError: CommanderError,
	helpText: string,
): string => {
	if (commanderError.code === "commander.helpDisplayed" && helpText !== "") {
		return helpText.trimEnd();
	}
	const message = commanderError.message.replace(/^error: /, "");
	if (message.startsWith("unknown option")) {
		const option = message.match(/'([^']+)'/)?.[1];
		return option === undefined
			? message.replace(/^unknown/, "Unknown")
			: `Unknown option for command: ${option}`;
	}
	if (message.startsWith("unknown command")) {
		return buildUnknownCommandMessage(extractUnknownCommand(message));
	}
	return message;
};

const commandResult = (
	command: CliCommand,
	globalOptions: GlobalOptions,
): ParsedCli => ({
	command,
	flags: {
		...(globalOptions.baseUrl === undefined
			? {}
			: { baseUrl: globalOptions.baseUrl }),
		...(globalOptions.token === undefined
			? {}
			: { token: globalOptions.token }),
		...(globalOptions.format === undefined
			? {}
			: { format: globalOptions.format }),
		...(globalOptions.json === true ? { json: true } : {}),
	},
});

const setCommand = (
	state: { value?: Result<ParsedCli, CliError> },
	program: Command,
	command: CliCommand,
): void => {
	state.value = ok(commandResult(command, program.opts<GlobalOptions>()));
};

const command = (
	program: Command,
	name: string,
	state: { helpText: string },
): Command =>
	program
		.command(name)
		.exitOverride()
		.configureOutput({
			writeErr: () => undefined,
			writeOut: (text) => {
				state.helpText += text;
			},
		});

const buildProgram = (state: {
	value?: Result<ParsedCli, CliError>;
	helpText: string;
}): Command => {
	const program = new Command();
	program
		.name("homestead")
		.exitOverride()
		.configureOutput({
			writeErr: () => undefined,
			writeOut: (text) => {
				state.helpText += text;
			},
		})
		.option("--base-url <url>")
		.option("--token <token>")
		.option("--format <format>")
		.option("--json")
		.showHelpAfterError(false)
		.showSuggestionAfterError(false);

	command(program, "health", state).action(() =>
		setCommand(state, program, { kind: "health" }),
	);
	command(program, "skill", state)
		.argument("[name]")
		.action((name: string | undefined) =>
			setCommand(
				state,
				program,
				name === undefined || name === "list"
					? { kind: "skill_list" }
					: { kind: "skill", name },
			),
		);
	command(program, "login", state)
		.option("--token-stdin")
		.action((options: { readonly tokenStdin?: boolean }) =>
			setCommand(state, program, {
				kind: "login",
				tokenFromStdin: options.tokenStdin === true,
			}),
		);
	command(program, "register", state)
		.option("--name <value>")
		.option("--email <value>")
		.option("--setup-token-stdin")
		.action((options: RegisterOptions) => {
			const name = required(
				options.name,
				"Usage: homestead register --name value [--email value] [--setup-token-stdin]",
			);
			state.value =
				name.status === "error"
					? name
					: ok(
							commandResult(
								{
									kind: "register",
									name: name.value,
									setupTokenFromStdin: options.setupTokenStdin === true,
									...(options.email === undefined
										? {}
										: { email: options.email }),
								},
								program.opts<GlobalOptions>(),
							),
						);
		});
	command(program, "revoke-token", state).action(() =>
		setCommand(state, program, { kind: "revoke_token" }),
	);
	command(program, "rotate-token", state).action(() =>
		setCommand(state, program, { kind: "rotate_token" }),
	);
	command(program, "me", state).action(() =>
		setCommand(state, program, { kind: "me" }),
	);
	command(program, "homes", state).action(() =>
		setCommand(state, program, { kind: "homes" }),
	);
	command(program, "memberships", state)
		.argument("[homeId]")
		.action((homeId: string | undefined) => {
			const parsed = required(homeId, "Usage: homestead memberships <homeId>");
			state.value =
				parsed.status === "error"
					? parsed
					: ok(
							commandResult(
								{ kind: "memberships", homeId: parsed.value },
								program.opts<GlobalOptions>(),
							),
						);
		});
	command(program, "summary", state)
		.argument("[homeId]")
		.action((homeId: string | undefined) => {
			const parsed = required(homeId, "Usage: homestead summary <homeId>");
			state.value =
				parsed.status === "error"
					? parsed
					: ok(
							commandResult(
								{ kind: "summary", homeId: parsed.value },
								program.opts<GlobalOptions>(),
							),
						);
		});
	command(program, "backup-export", state)
		.argument("[homeId]")
		.action((homeId: string | undefined) => {
			const parsed = required(homeId, "Usage: homestead backup-export <homeId>");
			state.value =
				parsed.status === "error"
					? parsed
					: ok(
							commandResult(
								{ kind: "backup_export", homeId: parsed.value },
								program.opts<GlobalOptions>(),
							),
						);
		});
	const setBulkCommand = (
		kind: "bulk_preview" | "bulk_apply",
		homeId: string | undefined,
		options: BulkOptions,
	): void => {
		const usage = `Usage: homestead ${kind === "bulk_preview" ? "bulk-preview" : "bulk-apply"} <homeId> --commands-json value`;
		if (homeId === undefined) {
			state.value = usageError(usage);
			return;
		}
		const parsedBody = parseBulkCommandsJson(options.commandsJson);
		state.value =
			parsedBody.status === "error"
				? parsedBody
				: ok(
						commandResult(
							{ kind, homeId, body: parsedBody.value },
							program.opts<GlobalOptions>(),
						),
					);
	};
	command(program, "bulk-preview", state)
		.argument("[homeId]")
		.option("--commands-json <json>")
		.action((homeId: string | undefined, options: BulkOptions) =>
			setBulkCommand("bulk_preview", homeId, options),
		);
	command(program, "bulk-apply", state)
		.argument("[homeId]")
		.option("--commands-json <json>")
		.action((homeId: string | undefined, options: BulkOptions) =>
			setBulkCommand("bulk_apply", homeId, options),
		);
	command(program, "notification-integrations", state).action(() =>
		setCommand(state, program, { kind: "notification_integrations" }),
	);
	command(program, "set-email-notification", state)
		.option("--email <email>")
		.option("--status <status>")
		.option("--delivery-mode <mode>")
		.action((options: NotificationIntegrationOptions) => {
			const usage =
				"Usage: homestead set-email-notification --email value [--status enabled|disabled] [--delivery-mode digest|individual]";
			const email = required(options.email, usage);
			if (email.status === "error") {
				state.value = email;
				return;
			}
			if (
				options.status !== undefined &&
				options.status !== "enabled" &&
				options.status !== "disabled"
			) {
				state.value = usageError(
					"Notification status must be enabled or disabled.",
				);
				return;
			}
			if (
				options.deliveryMode !== undefined &&
				options.deliveryMode !== "digest" &&
				options.deliveryMode !== "individual"
			) {
				state.value = usageError(
					"Email delivery mode must be digest or individual.",
				);
				return;
			}
			setCommand(state, program, {
				kind: "set_email_notification",
				emailAddress: email.value,
				status: options.status === "disabled" ? "disabled" : "enabled",
				deliveryMode: options.deliveryMode ?? "digest",
			});
		});
	command(program, "delete-notification-integration", state)
		.argument("[channel]")
		.action((channel: string | undefined) => {
			const parsed = required(
				channel,
				"Usage: homestead delete-notification-integration <email|telegram>",
			);
			if (parsed.status === "error") {
				state.value = parsed;
				return;
			}
			if (parsed.value !== "email" && parsed.value !== "telegram") {
				state.value = usageError("Channel must be email or telegram.");
				return;
			}
			setCommand(state, program, {
				kind: "delete_notification_integration",
				channel: parsed.value,
			});
		});
	command(program, "task-reminder-schedule", state)
		.argument("[taskId]")
		.action((taskId: string | undefined) => {
			const parsed = required(
				taskId,
				"Usage: homestead task-reminder-schedule <taskId>",
			);
			state.value =
				parsed.status === "error"
					? parsed
					: ok(
							commandResult(
								{ kind: "task_reminder_schedule", taskId: parsed.value },
								program.opts<GlobalOptions>(),
							),
						);
		});
	command(program, "set-task-reminder-schedule", state)
		.argument("[taskId]")
		.option("--channel <channel>", "email or telegram", collectValues, [])
		.option(
			"--rule <rule>",
			"frequency:startsBeforeDueDays:endsBeforeDueDays",
			collectValues,
			[],
		)
		.option("--email-default")
		.action(
			(taskId: string | undefined, options: TaskReminderScheduleOptions) => {
				const parsedTaskId = required(
					taskId,
					"Usage: homestead set-task-reminder-schedule <taskId> (--email-default|--channel value --rule frequency:start:end)",
				);
				if (parsedTaskId.status === "error") {
					state.value = parsedTaskId;
					return;
				}
				const schedule = parseReminderScheduleInput({
					channels: options.channel ?? [],
					rules: options.rule ?? [],
					emailDefault: options.emailDefault === true,
				});
				if (schedule.status === "error") {
					state.value = schedule;
					return;
				}
				setCommand(state, program, {
					kind: "set_task_reminder_schedule",
					taskId: parsedTaskId.value,
					channels: schedule.value.channels,
					rules: schedule.value.rules,
				});
			},
		);
	command(program, "delete-task-reminder-schedule", state)
		.argument("[taskId]")
		.action((taskId: string | undefined) => {
			const parsed = required(
				taskId,
				"Usage: homestead delete-task-reminder-schedule <taskId>",
			);
			state.value =
				parsed.status === "error"
					? parsed
					: ok(
							commandResult(
								{ kind: "delete_task_reminder_schedule", taskId: parsed.value },
								program.opts<GlobalOptions>(),
							),
						);
		});
	command(program, "reminder-deliveries", state)
		.argument("[homeId]")
		.option("--status <status>")
		.option("--channel <channel>")
		.option("--task-id <taskId>")
		.option("--limit <limit>", "maximum deliveries to return", parseLimit)
		.action((homeId: string | undefined, options: ReminderDeliveryOptions) => {
			const usage =
				"Usage: homestead reminder-deliveries <homeId> [--status pending|sending|sent|skipped|failed] [--channel email|telegram] [--task-id value] [--limit n]";
			const parsedHomeId = required(homeId, usage);
			if (parsedHomeId.status === "error") {
				state.value = parsedHomeId;
				return;
			}
			if (
				options.status !== undefined &&
				options.status !== "pending" &&
				options.status !== "sending" &&
				options.status !== "sent" &&
				options.status !== "skipped" &&
				options.status !== "failed"
			) {
				state.value = usageError("Invalid reminder delivery status.");
				return;
			}
			if (
				options.channel !== undefined &&
				options.channel !== "email" &&
				options.channel !== "telegram"
			) {
				state.value = usageError("Channel must be email or telegram.");
				return;
			}
			setCommand(state, program, {
				kind: "reminder_deliveries",
				homeId: parsedHomeId.value,
				...(options.status === undefined
					? {}
					: {
							status: options.status as
								| "pending"
								| "sending"
								| "sent"
								| "skipped"
								| "failed",
						}),
				...(options.channel === undefined
					? {}
					: { channel: options.channel as "email" | "telegram" }),
				...(options.taskId === undefined ? {} : { taskId: options.taskId }),
				...(options.limit === undefined ? {} : { limit: options.limit }),
			});
		});
	command(program, "templates", state)
		.option("--kind <kind>")
		.option("--category <category>")
		.action((options: TemplateOptions) => {
			if (
				options.kind !== undefined &&
				options.kind !== "asset" &&
				options.kind !== "task"
			) {
				state.value = usageError("Template kind must be asset or task.");
				return;
			}
			setCommand(state, program, {
				kind: "templates",
				...(options.kind === undefined
					? {}
					: { templateKind: options.kind as "asset" | "task" }),
				...(options.category === undefined
					? {}
					: { category: options.category }),
			});
		});
	command(program, "template", state)
		.argument("[templateId]")
		.action((templateId: string | undefined) => {
			const parsed = required(
				templateId,
				"Usage: homestead template <templateId>",
			);
			state.value =
				parsed.status === "error"
					? parsed
					: ok(
							commandResult(
								{ kind: "template", templateId: parsed.value },
								program.opts<GlobalOptions>(),
							),
						);
		});
	command(program, "recommendations", state)
		.argument("[homeId]")
		.action((homeId: string | undefined) => {
			const parsed = required(
				homeId,
				"Usage: homestead recommendations <homeId>",
			);
			state.value =
				parsed.status === "error"
					? parsed
					: ok(
							commandResult(
								{ kind: "recommendations", homeId: parsed.value },
								program.opts<GlobalOptions>(),
							),
						);
		});
	command(program, "instantiate-template", state)
		.argument("[homeId]")
		.argument("[templateId]")
		.option("--asset-id <assetId>")
		.option("--due-at <dueAt>")
		.action(
			(
				homeId: string | undefined,
				templateId: string | undefined,
				options: InstantiateTemplateOptions,
			) => {
				const usage =
					"Usage: homestead instantiate-template <homeId> <templateId> [--asset-id value] [--due-at value]";
				if (homeId === undefined || templateId === undefined) {
					state.value = usageError(usage);
					return;
				}
				setCommand(state, program, {
					kind: "instantiate_template",
					homeId,
					templateId,
					...(options.assetId === undefined
						? {}
						: { assetId: options.assetId }),
					...(options.dueAt === undefined ? {} : { dueAt: options.dueAt }),
				});
			},
		);
	command(program, "complete-task", state)
		.argument("[taskId]")
		.option("--notes <notes>")
		.action((taskId: string | undefined, options: NotesOptions) => {
			const parsed = required(
				taskId,
				"Usage: homestead complete-task <taskId> [--notes value]",
			);
			state.value =
				parsed.status === "error"
					? parsed
					: ok(
							commandResult(
								{
									kind: "complete_task",
									taskId: parsed.value,
									...(options.notes === undefined
										? {}
										: { notes: options.notes }),
								},
								program.opts<GlobalOptions>(),
							),
						);
		});
	command(program, "assets", state)
		.argument("[homeId]")
		.option("--type <type>")
		.option("--status <status>")
		.action((homeId: string | undefined, options: AssetListOptions) => {
			const parsed = required(
				homeId,
				"Usage: homestead assets <homeId> [--type value] [--status active|archived]",
			);
			if (parsed.status === "error") {
				state.value = parsed;
				return;
			}
			if (
				options.status !== undefined &&
				options.status !== "active" &&
				options.status !== "archived"
			) {
				state.value = usageError("Asset status must be active or archived.");
				return;
			}
			setCommand(state, program, {
				kind: "assets",
				homeId: parsed.value,
				...(options.type === undefined ? {} : { assetType: options.type }),
				...(options.status === undefined
					? {}
					: { status: options.status as "active" | "archived" }),
			});
		});
	command(program, "create-asset", state)
		.argument("[homeId]")
		.option("--name <name>")
		.option("--type <type>")
		.option("--parent-asset-id <parentAssetId>")
		.option("--notes <notes>")
		.option("--profile-json <profileJson>")
		.action((homeId: string | undefined, options: CreateAssetOptions) => {
			const usage =
				"Usage: homestead create-asset <homeId> --name value --type value [--parent-asset-id value] [--notes value] [--profile-json object]";
			if (homeId === undefined) {
				state.value = usageError(usage);
				return;
			}
			const name = required(options.name, usage);
			if (name.status === "error") {
				state.value = name;
				return;
			}
			const assetType = required(options.type, usage);
			if (assetType.status === "error") {
				state.value = assetType;
				return;
			}
			const profile = parseProfileJson(options.profileJson);
			if (profile.status === "error") {
				state.value = profile;
				return;
			}
			setCommand(state, program, {
				kind: "create_asset",
				homeId,
				name: name.value,
				assetType: assetType.value,
				...(options.parentAssetId === undefined
					? {}
					: { parentAssetId: options.parentAssetId }),
				...(options.notes === undefined ? {} : { notes: options.notes }),
				...(profile.value === undefined ? {} : { profile: profile.value }),
			});
		});
	command(program, "asset", state)
		.argument("[assetId]")
		.action((assetId: string | undefined) => {
			const parsed = required(assetId, "Usage: homestead asset <assetId>");
			state.value =
				parsed.status === "error"
					? parsed
					: ok(
							commandResult(
								{ kind: "asset", assetId: parsed.value },
								program.opts<GlobalOptions>(),
							),
						);
		});
	command(program, "update-asset", state)
		.argument("[assetId]")
		.option("--name <name>")
		.option("--type <type>")
		.option("--parent-asset-id <parentAssetId>")
		.option("--clear-parent-asset-id")
		.option("--notes <notes>")
		.option("--clear-notes")
		.option("--profile-json <profileJson>")
		.action((assetId: string | undefined, options: UpdateAssetOptions) => {
			const usage =
				"Usage: homestead update-asset <assetId> [--name value] [--type value] [--parent-asset-id value|--clear-parent-asset-id] [--notes value|--clear-notes] [--profile-json object]";
			if (assetId === undefined) {
				state.value = usageError(usage);
				return;
			}
			if (
				options.parentAssetId !== undefined &&
				options.clearParentAssetId === true
			) {
				state.value = usageError("Cannot set and clear parent asset id.");
				return;
			}
			if (options.notes !== undefined && options.clearNotes === true) {
				state.value = usageError("Cannot set and clear notes.");
				return;
			}
			const profile = parseProfileJson(options.profileJson);
			if (profile.status === "error") {
				state.value = profile;
				return;
			}
			const updateCommand: {
				kind: "update_asset";
				assetId: string;
				name?: string;
				assetType?: string;
				parentAssetId?: string | null;
				notes?: string | null;
				profile?: JsonObject;
			} = { kind: "update_asset", assetId };
			if (options.name !== undefined) updateCommand.name = options.name;
			if (options.type !== undefined) updateCommand.assetType = options.type;
			if (profile.value !== undefined) updateCommand.profile = profile.value;
			if (options.clearParentAssetId === true)
				updateCommand.parentAssetId = null;
			else if (options.parentAssetId !== undefined)
				updateCommand.parentAssetId = options.parentAssetId;
			if (options.clearNotes === true) updateCommand.notes = null;
			else if (options.notes !== undefined) updateCommand.notes = options.notes;
			state.value =
				Object.keys(updateCommand).length > 2
					? ok(commandResult(updateCommand, program.opts<GlobalOptions>()))
					: usageError(usage);
		});
	command(program, "archive-asset", state)
		.argument("[assetId]")
		.action((assetId: string | undefined) => {
			const parsed = required(
				assetId,
				"Usage: homestead archive-asset <assetId>",
			);
			state.value =
				parsed.status === "error"
					? parsed
					: ok(
							commandResult(
								{ kind: "archive_asset", assetId: parsed.value },
								program.opts<GlobalOptions>(),
							),
						);
		});
	command(program, "tasks", state)
		.argument("[homeId]")
		.option("--asset-id <assetId>")
		.option("--status <status>")
		.action((homeId: string | undefined, options: TaskListOptions) => {
			const parsed = required(
				homeId,
				"Usage: homestead tasks <homeId> [--asset-id value] [--status open|completed|archived]",
			);
			if (parsed.status === "error") {
				state.value = parsed;
				return;
			}
			if (
				options.status !== undefined &&
				options.status !== "open" &&
				options.status !== "completed" &&
				options.status !== "archived"
			) {
				state.value = usageError(
					"Task status must be open, completed, or archived.",
				);
				return;
			}
			setCommand(state, program, {
				kind: "tasks",
				homeId: parsed.value,
				...(options.assetId === undefined ? {} : { assetId: options.assetId }),
				...(options.status === undefined
					? {}
					: { status: options.status as "open" | "completed" | "archived" }),
			});
		});
	command(program, "create-task", state)
		.argument("[homeId]")
		.option("--title <title>")
		.option("--asset-id <assetId>")
		.option("--notes <notes>")
		.option("--due-at <dueAt>")
		.option("--repeat-every <n>")
		.option("--repeat-unit <unit>")
		.action((homeId: string | undefined, options: CreateTaskOptions) => {
			const usage =
				"Usage: homestead create-task <homeId> --title value [--asset-id value] [--notes value] [--due-at value] [--repeat-every n --repeat-unit day|week|month|year]";
			if (homeId === undefined) {
				state.value = usageError(usage);
				return;
			}
			const title = required(options.title, usage);
			if (title.status === "error") {
				state.value = title;
				return;
			}
			const recurrence = parseTaskRecurrenceInput(options);
			if (recurrence.status === "error") {
				state.value = recurrence;
				return;
			}
			if (recurrence.value !== undefined && options.dueAt === undefined) {
				state.value = usageError("Recurring tasks require --due-at.");
				return;
			}
			state.value = ok(
				commandResult(
					{
						kind: "create_task",
						homeId,
						title: title.value,
						...(options.assetId === undefined
							? {}
							: { assetId: options.assetId }),
						...(options.notes === undefined ? {} : { notes: options.notes }),
						...(options.dueAt === undefined ? {} : { dueAt: options.dueAt }),
						...(recurrence.value === undefined
							? {}
							: { recurrence: recurrence.value }),
					},
					program.opts<GlobalOptions>(),
				),
			);
		});
	command(program, "task", state)
		.argument("[taskId]")
		.action((taskId: string | undefined) => {
			const parsed = required(taskId, "Usage: homestead task <taskId>");
			state.value =
				parsed.status === "error"
					? parsed
					: ok(
							commandResult(
								{ kind: "task", taskId: parsed.value },
								program.opts<GlobalOptions>(),
							),
						);
		});
	command(program, "update-task", state)
		.argument("[taskId]")
		.option("--title <title>")
		.option("--asset-id <assetId>")
		.option("--clear-asset-id")
		.option("--notes <notes>")
		.option("--clear-notes")
		.option("--due-at <dueAt>")
		.option("--clear-due-at")
		.option("--repeat-every <n>")
		.option("--repeat-unit <unit>")
		.option("--clear-recurrence")
		.option("--status <status>")
		.action((taskId: string | undefined, options: UpdateTaskOptions) => {
			const usage =
				"Usage: homestead update-task <taskId> [--title value] [--asset-id value|--clear-asset-id] [--notes value|--clear-notes] [--due-at value|--clear-due-at] [--repeat-every n --repeat-unit day|week|month|year|--clear-recurrence] [--status open|completed]";
			if (taskId === undefined) {
				state.value = usageError(usage);
				return;
			}
			if (options.assetId !== undefined && options.clearAssetId === true) {
				state.value = usageError("Cannot set and clear asset id.");
				return;
			}
			if (options.notes !== undefined && options.clearNotes === true) {
				state.value = usageError("Cannot set and clear notes.");
				return;
			}
			if (options.dueAt !== undefined && options.clearDueAt === true) {
				state.value = usageError("Cannot set and clear due date.");
				return;
			}
			if (
				(options.repeatEvery !== undefined ||
					options.repeatUnit !== undefined) &&
				options.clearRecurrence === true
			) {
				state.value = usageError("Cannot set and clear recurrence.");
				return;
			}
			const recurrence = parseTaskRecurrenceInput(options);
			if (recurrence.status === "error") {
				state.value = recurrence;
				return;
			}
			if (
				options.status !== undefined &&
				options.status !== "open" &&
				options.status !== "completed"
			) {
				state.value = usageError("Task status must be open or completed.");
				return;
			}
			const updateCommand: {
				kind: "update_task";
				taskId: string;
				title?: string;
				assetId?: string | null;
				notes?: string | null;
				dueAt?: string | null;
				recurrence?: {
					readonly frequency: "daily" | "weekly" | "monthly" | "yearly";
					readonly interval: number;
				} | null;
				status?: "open" | "completed";
			} = { kind: "update_task", taskId };
			if (options.title !== undefined) updateCommand.title = options.title;
			if (options.status !== undefined) updateCommand.status = options.status;
			if (options.clearAssetId === true) updateCommand.assetId = null;
			else if (options.assetId !== undefined)
				updateCommand.assetId = options.assetId;
			if (options.clearNotes === true) updateCommand.notes = null;
			else if (options.notes !== undefined) updateCommand.notes = options.notes;
			if (options.clearDueAt === true) updateCommand.dueAt = null;
			else if (options.dueAt !== undefined) updateCommand.dueAt = options.dueAt;
			if (options.clearRecurrence === true) updateCommand.recurrence = null;
			else if (recurrence.value !== undefined)
				updateCommand.recurrence = recurrence.value;
			state.value =
				Object.keys(updateCommand).length > 2
					? ok(commandResult(updateCommand, program.opts<GlobalOptions>()))
					: usageError(usage);
		});
	command(program, "task-completions", state)
		.argument("[taskId]")
		.action((taskId: string | undefined) => {
			const parsed = required(
				taskId,
				"Usage: homestead task-completions <taskId>",
			);
			state.value =
				parsed.status === "error"
					? parsed
					: ok(
							commandResult(
								{ kind: "task_completions", taskId: parsed.value },
								program.opts<GlobalOptions>(),
							),
						);
		});
	command(program, "archive-task", state)
		.argument("[taskId]")
		.action((taskId: string | undefined) => {
			const parsed = required(taskId, "Usage: homestead archive-task <taskId>");
			state.value =
				parsed.status === "error"
					? parsed
					: ok(
							commandResult(
								{ kind: "archive_task", taskId: parsed.value },
								program.opts<GlobalOptions>(),
							),
						);
		});

	return program;
};

export const parseCli = (
	args: readonly string[],
): Result<ParsedCli, CliError> => {
	const state: { value?: Result<ParsedCli, CliError>; helpText: string } = {
		helpText: "",
	};
	const program = buildProgram(state);
	if (args.length === 0) {
		return ok({ helpText: program.helpInformation() });
	}
	try {
		program.parse([...args], { from: "user" });
	} catch (caught) {
		if (caught instanceof CommanderError) {
			if (caught.code === "commander.helpDisplayed") {
				return ok({
					helpText:
						state.helpText === "" ? program.helpInformation() : state.helpText,
				});
			}
			return usageError(normalizeCommanderMessage(caught, state.helpText));
		}
		throw caught;
	}
	return state.value ?? usageError(defaultUsage);
};
