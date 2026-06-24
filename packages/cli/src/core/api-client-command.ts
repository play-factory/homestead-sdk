import type {
	BulkApplyRequestBody,
	HomesteadApiClient,
	RegisterRequestBody,
} from "@homestead/sdk";

import { commandRequiresAuth, type CliCommand } from "./commands.js";
import type { CliConfig } from "./config.js";
import type { CliError } from "./errors.js";
import { error, ok, type Result } from "./result.js";

export const cliSdkCoverageLedger = {
	getHealth: ["health"],
	getCurrentPrincipal: ["login", "me"],
	registerUser: ["register"],
	revokeCurrentToken: ["revoke_token"],
	rotateCurrentToken: ["rotate_token"],
	listApiTokens: [],
	createApiToken: [],
	revokeApiToken: [],
	startDeviceLogin: [],
	getDeviceLoginRequest: [],
	approveDeviceLogin: [],
	denyDeviceLogin: [],
	pollDeviceLoginToken: [],
	postAgentMessage: [],
	postAgentMessageStream: [],
	approveAgentPlan: [],
	rejectAgentPlan: [],
	listNotificationIntegrations: ["notification_integrations"],
	putEmailNotificationIntegration: ["set_email_notification"],
	putTelegramNotificationIntegration: [],
	deleteNotificationIntegration: ["delete_notification_integration"],
	listHomes: ["homes"],
	createHome: [],
	listHomeMemberships: ["memberships"],
	deleteHomeMembership: [],
	getHomeSummary: ["summary"],
	exportHomeBackup: ["backup_export"],
	previewBulkApply: ["bulk_preview"],
	applyBulk: ["bulk_apply"],
	listReminderDeliveryHistory: ["reminder_deliveries"],
	listCuratedTemplates: ["templates"],
	getCuratedTemplate: ["template"],
	listCuratedTemplateRecommendations: ["recommendations"],
	instantiateCuratedTemplate: ["instantiate_template"],
	listAssets: ["assets"],
	createAsset: ["create_asset"],
	getAsset: ["asset"],
	patchAsset: ["update_asset"],
	archiveAsset: ["archive_asset"],
	listAssetFiles: [],
	uploadAssetFile: [],
	listTasks: ["tasks"],
	createTask: ["create_task"],
	getTask: ["task"],
	patchTask: ["update_task"],
	archiveTask: ["archive_task"],
	getTaskReminderSchedule: ["task_reminder_schedule"],
	putTaskReminderSchedule: ["set_task_reminder_schedule"],
	deleteTaskReminderSchedule: ["delete_task_reminder_schedule"],
	listTaskCompletions: ["task_completions"],
	completeTask: ["complete_task"],
} as const satisfies {
	readonly [M in keyof HomesteadApiClient]: readonly CliCommand["kind"][];
};

type LocalCommandKind = "skill_list" | "skill";
type CoveredCommandKind =
	(typeof cliSdkCoverageLedger)[keyof typeof cliSdkCoverageLedger][number];
type UncoveredCommandKind = Exclude<
	CliCommand["kind"],
	CoveredCommandKind | LocalCommandKind
>;
const _allCliCommandsCovered: UncoveredCommandKind extends never
	? true
	: never = true;
void _allCliCommandsCovered;

export type CliApiOperation =
	| { readonly kind: "health" }
	| { readonly kind: "login" | "me" }
	| { readonly kind: "register"; readonly body: RegisterRequestBody }
	| { readonly kind: "revoke_token" }
	| { readonly kind: "rotate_token" }
	| { readonly kind: "homes" }
	| { readonly kind: "memberships"; readonly homeId: string }
	| { readonly kind: "summary"; readonly homeId: string }
	| { readonly kind: "backup_export"; readonly homeId: string }
	| {
			readonly kind: "bulk_preview" | "bulk_apply";
			readonly homeId: string;
			readonly body: BulkApplyRequestBody;
	  }
	| { readonly kind: "notification_integrations" }
	| {
			readonly kind: "set_email_notification";
			readonly body: {
				readonly status: "enabled" | "disabled";
				readonly config: {
					readonly emailAddress: string;
					readonly deliveryMode: "digest" | "individual";
				};
			};
	  }
	| {
			readonly kind: "delete_notification_integration";
			readonly channel: "email" | "telegram";
	  }
	| { readonly kind: "task_reminder_schedule"; readonly taskId: string }
	| {
			readonly kind: "set_task_reminder_schedule";
			readonly taskId: string;
			readonly body: {
				readonly channels: ("email" | "telegram")[];
				readonly rules: {
					readonly frequency: "daily" | "weekly";
					readonly startsBeforeDueDays: number;
					readonly endsBeforeDueDays: number;
				}[];
			};
	  }
	| { readonly kind: "delete_task_reminder_schedule"; readonly taskId: string }
	| {
			readonly kind: "reminder_deliveries";
			readonly homeId: string;
			readonly query?: {
				readonly status?: "pending" | "sending" | "sent" | "skipped" | "failed";
				readonly channel?: "email" | "telegram";
				readonly taskId?: string;
				readonly limit?: number;
			};
	  }
	| {
			readonly kind: "templates";
			readonly query?: {
				readonly kind?: "asset" | "task";
				readonly category?: string;
			};
	  }
	| { readonly kind: "template"; readonly templateId: string }
	| { readonly kind: "recommendations"; readonly homeId: string }
	| {
			readonly kind: "instantiate_template";
			readonly homeId: string;
			readonly templateId: string;
			readonly body: { readonly assetId?: string; readonly dueAt?: string };
	  }
	| {
			readonly kind: "complete_task";
			readonly taskId: string;
			readonly body: { readonly notes?: string };
	  }
	| {
			readonly kind: "assets";
			readonly homeId: string;
			readonly query?: {
				readonly type?: string;
				readonly status?: "active" | "archived";
			};
	  }
	| {
			readonly kind: "create_asset";
			readonly homeId: string;
			readonly body: {
				readonly name: string;
				readonly type: string;
				readonly parentAssetId?: string;
				readonly notes?: string;
				readonly profile?: Readonly<Record<string, unknown>>;
			};
	  }
	| { readonly kind: "asset"; readonly assetId: string }
	| {
			readonly kind: "update_asset";
			readonly assetId: string;
			readonly body: {
				readonly name?: string;
				readonly type?: string;
				readonly parentAssetId?: string | null;
				readonly notes?: string | null;
				readonly profile?: Readonly<Record<string, unknown>>;
			};
	  }
	| { readonly kind: "archive_asset"; readonly assetId: string }
	| {
			readonly kind: "tasks";
			readonly homeId: string;
			readonly query?: {
				readonly assetId?: string;
				readonly status?: "open" | "completed" | "archived";
			};
	  }
	| {
			readonly kind: "create_task";
			readonly homeId: string;
			readonly body: {
				readonly title: string;
				readonly assetId?: string;
				readonly notes?: string;
				readonly dueAt?: string;
				readonly recurrence?: {
					readonly frequency: "daily" | "weekly" | "monthly" | "yearly";
					readonly interval: number;
				};
			};
	  }
	| { readonly kind: "task"; readonly taskId: string }
	| {
			readonly kind: "update_task";
			readonly taskId: string;
			readonly body: {
				readonly title?: string;
				readonly assetId?: string | null;
				readonly notes?: string | null;
				readonly dueAt?: string | null;
				readonly recurrence?: {
					readonly frequency: "daily" | "weekly" | "monthly" | "yearly";
					readonly interval: number;
				} | null;
				readonly status?: "open" | "completed";
			};
	  }
	| { readonly kind: "task_completions"; readonly taskId: string }
	| { readonly kind: "archive_task"; readonly taskId: string };

const authenticationError = (): CliError => ({
	type: "authentication_config_error",
	message:
		"This command requires HOMESTEAD_API_TOKEN, stored login, or the --token flag.",
});

export const planCliApiOperation = (
	command: CliCommand,
	config: CliConfig,
): Result<CliApiOperation, CliError> => {
	if (commandRequiresAuth(command) && config.token === null)
		return error(authenticationError());
	switch (command.kind) {
		case "health":
			return ok({ kind: "health" });
		case "login":
			return ok({ kind: "login" });
		case "me":
			return ok({ kind: "me" });
		case "register":
			return ok({
				kind: "register",
				body: {
					name: command.name,
					...(command.email === undefined ? {} : { email: command.email }),
					...(command.setupToken === undefined
						? {}
						: { setupToken: command.setupToken }),
				},
			});
		case "revoke_token":
			return ok({ kind: "revoke_token" });
		case "rotate_token":
			return ok({ kind: "rotate_token" });
		case "homes":
			return ok({ kind: "homes" });
		case "memberships":
			return ok({ kind: "memberships", homeId: command.homeId });
		case "summary":
			return ok({ kind: "summary", homeId: command.homeId });
		case "backup_export":
			return ok({ kind: "backup_export", homeId: command.homeId });
		case "bulk_preview":
		case "bulk_apply":
			return ok({
				kind: command.kind,
				homeId: command.homeId,
				body: command.body,
			});
		case "notification_integrations":
			return ok({ kind: "notification_integrations" });
		case "set_email_notification":
			return ok({
				kind: "set_email_notification",
				body: {
					status: command.status,
					config: {
						emailAddress: command.emailAddress,
						deliveryMode: command.deliveryMode,
					},
				},
			});
		case "delete_notification_integration":
			return ok({
				kind: "delete_notification_integration",
				channel: command.channel,
			});
		case "task_reminder_schedule":
			return ok({
				kind: "task_reminder_schedule",
				taskId: command.taskId,
			});
		case "set_task_reminder_schedule":
			return ok({
				kind: "set_task_reminder_schedule",
				taskId: command.taskId,
				body: {
					channels: [...command.channels],
					rules: command.rules.map((rule) => ({ ...rule })),
				},
			});
		case "delete_task_reminder_schedule":
			return ok({
				kind: "delete_task_reminder_schedule",
				taskId: command.taskId,
			});
		case "reminder_deliveries":
			return ok({
				kind: "reminder_deliveries",
				homeId: command.homeId,
				query: {
					...(command.status === undefined ? {} : { status: command.status }),
					...(command.channel === undefined
						? {}
						: { channel: command.channel }),
					...(command.taskId === undefined ? {} : { taskId: command.taskId }),
					...(command.limit === undefined ? {} : { limit: command.limit }),
				},
			});
		case "templates":
			return ok({
				kind: "templates",
				query: {
					...(command.templateKind === undefined
						? {}
						: { kind: command.templateKind }),
					...(command.category === undefined
						? {}
						: { category: command.category }),
				},
			});
		case "template":
			return ok({ kind: "template", templateId: command.templateId });
		case "recommendations":
			return ok({ kind: "recommendations", homeId: command.homeId });
		case "instantiate_template":
			return ok({
				kind: "instantiate_template",
				homeId: command.homeId,
				templateId: command.templateId,
				body: {
					...(command.assetId === undefined
						? {}
						: { assetId: command.assetId }),
					...(command.dueAt === undefined ? {} : { dueAt: command.dueAt }),
				},
			});
		case "complete_task":
			return ok({
				kind: "complete_task",
				taskId: command.taskId,
				body: command.notes === undefined ? {} : { notes: command.notes },
			});
		case "assets":
			return ok({
				kind: "assets",
				homeId: command.homeId,
				query: {
					...(command.assetType === undefined
						? {}
						: { type: command.assetType }),
					...(command.status === undefined ? {} : { status: command.status }),
				},
			});
		case "create_asset":
			return ok({
				kind: "create_asset",
				homeId: command.homeId,
				body: {
					name: command.name,
					type: command.assetType,
					...(command.parentAssetId === undefined
						? {}
						: { parentAssetId: command.parentAssetId }),
					...(command.notes === undefined ? {} : { notes: command.notes }),
					...(command.profile === undefined
						? {}
						: { profile: command.profile }),
				},
			});
		case "asset":
			return ok({ kind: "asset", assetId: command.assetId });
		case "update_asset":
			return ok({
				kind: "update_asset",
				assetId: command.assetId,
				body: {
					...(command.name === undefined ? {} : { name: command.name }),
					...(command.assetType === undefined
						? {}
						: { type: command.assetType }),
					...(command.parentAssetId === undefined
						? {}
						: { parentAssetId: command.parentAssetId }),
					...(command.notes === undefined ? {} : { notes: command.notes }),
					...(command.profile === undefined
						? {}
						: { profile: command.profile }),
				},
			});
		case "archive_asset":
			return ok({ kind: "archive_asset", assetId: command.assetId });
		case "tasks":
			return ok({
				kind: "tasks",
				homeId: command.homeId,
				query: {
					...(command.assetId === undefined
						? {}
						: { assetId: command.assetId }),
					...(command.status === undefined ? {} : { status: command.status }),
				},
			});
		case "create_task":
			return ok({
				kind: "create_task",
				homeId: command.homeId,
				body: {
					title: command.title,
					...(command.assetId === undefined
						? {}
						: { assetId: command.assetId }),
					...(command.notes === undefined ? {} : { notes: command.notes }),
					...(command.dueAt === undefined ? {} : { dueAt: command.dueAt }),
					...(command.recurrence === undefined
						? {}
						: { recurrence: command.recurrence }),
				},
			});
		case "task":
			return ok({ kind: "task", taskId: command.taskId });
		case "update_task":
			return ok({
				kind: "update_task",
				taskId: command.taskId,
				body: {
					...(command.title === undefined ? {} : { title: command.title }),
					...(command.assetId === undefined
						? {}
						: { assetId: command.assetId }),
					...(command.notes === undefined ? {} : { notes: command.notes }),
					...(command.dueAt === undefined ? {} : { dueAt: command.dueAt }),
					...(command.recurrence === undefined
						? {}
						: { recurrence: command.recurrence }),
					...(command.status === undefined ? {} : { status: command.status }),
				},
			});
		case "task_completions":
			return ok({ kind: "task_completions", taskId: command.taskId });
		case "archive_task":
			return ok({ kind: "archive_task", taskId: command.taskId });
		case "skill_list":
		case "skill":
			return error({
				type: "usage_error",
				message: "Skill commands are handled locally.",
			});
	}
};
