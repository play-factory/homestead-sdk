import { z } from "zod";

import type {
	AgentMessageSuccessEnvelope,
	AgentPlanApprovalSuccessEnvelope,
	AgentPlanRejectionSuccessEnvelope,
	ApiToken,
	ApiTokenSuccessEnvelope,
	AssetSuccessEnvelope,
	BulkApplyPreviewSuccessEnvelope,
	BulkApplySuccessEnvelope,
	CompleteTaskSuccessEnvelope,
	ListAssetFilesSuccessEnvelope,
	UploadAssetFileSuccessEnvelope,
	CreateApiTokenSuccessEnvelope,
	CreateAssetSuccessEnvelope,
	CreateHomeSuccessEnvelope,
	CreateTaskSuccessEnvelope,
	CurrentPrincipalSuccessEnvelope,
	CuratedTemplateSuccessEnvelope,
	DeviceLoginRequestDetailsSuccessEnvelope,
	DeviceLoginStartSuccessEnvelope,
	DeviceLoginStatusSuccessEnvelope,
	DeviceLoginTokenSuccessEnvelope,
	HealthSuccessEnvelope,
	HomeBackupSuccessEnvelope,
	HomeMembershipSuccessEnvelope,
	HomeSummarySuccessEnvelope,
	ListApiTokensSuccessEnvelope,
	ListAssetsSuccessEnvelope,
	ListReminderDeliveryHistorySuccessEnvelope,
	ListNotificationIntegrationsSuccessEnvelope,
	NotificationIntegrationSuccessEnvelope,
	ListCuratedTemplateRecommendationsSuccessEnvelope,
	ListCuratedTemplatesSuccessEnvelope,
	ListHomeMembershipsSuccessEnvelope,
	ListHomesSuccessEnvelope,
	ListTaskCompletionsSuccessEnvelope,
	ListTasksSuccessEnvelope,
	RegisterSuccessEnvelope,
	RevokeCurrentTokenSuccessEnvelope,
	RotateCurrentTokenSuccessEnvelope,
	TaskReminderScheduleSuccessEnvelope,
	TaskSuccessEnvelope,
	TemplateInstantiationSuccessEnvelope,
} from "./api-types.js";

type User = CurrentPrincipalSuccessEnvelope["data"]["user"];
type CuratedTemplate = CuratedTemplateSuccessEnvelope["data"]["template"];
type CuratedTemplateDefinition = CuratedTemplate["definition"];
type Asset = AssetSuccessEnvelope["data"]["asset"];
type AssetFile = UploadAssetFileSuccessEnvelope["data"]["file"];
type Task = TaskSuccessEnvelope["data"]["task"];
type TaskCompletion = CompleteTaskSuccessEnvelope["data"]["completion"];
type TaskReminderSchedule = NonNullable<
	TaskReminderScheduleSuccessEnvelope["data"]["schedule"]
>;
type NotificationIntegration =
	NotificationIntegrationSuccessEnvelope["data"]["integration"];

const CountSchema = z.number().int().nonnegative();
type JsonScalar = string | number | boolean | null;
type JsonValue =
	| JsonScalar
	| JsonValue[]
	| { readonly [key: string]: JsonValue };
const JsonValueSchema: z.ZodType<JsonValue> = z.lazy(() =>
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

const UserSchema = z
	.object({
		id: z.string().min(1),
		name: z.string().min(1),
		email: z.string().optional(),
	})
	.transform((user): User => {
		const { email, ...requiredUser } = user;
		return email === undefined ? requiredUser : { ...requiredUser, email };
	});

const HomeSchema = z.object({
	id: z.string().min(1),
	name: z.string().min(1),
	role: z.literal("owner"),
});

const ApiTokenScopeSchema = z.enum([
	"profile:read",
	"homes:read",
	"homes:write",
	"assets:read",
	"assets:write",
	"tasks:read",
	"tasks:write",
	"reminders:read",
	"reminders:write",
	"templates:read",
	"templates:write",
	"notifications:read",
	"notifications:write",
	"assistant:read",
	"assistant:write",
	"backup:read",
	"backup:write",
	"tokens:read",
	"tokens:write",
]);

const ApiTokenSchema = z.object({
	id: z.string().min(1),
	label: z.string().min(1).nullable(),
	clientType: z
		.enum(["cli", "automation", "dashboard_legacy", "integration"])
		.nullable(),
	scopes: z.array(ApiTokenScopeSchema),
	homeIds: z.array(z.string().min(1)).nullable(),
	createdAt: z.string().min(1),
	expiresAt: z.string().min(1).nullable(),
	revokedAt: z.string().min(1).nullable(),
	lastUsedAt: z.string().min(1).nullable(),
}) satisfies z.ZodType<ApiToken>;

const CuratedTemplateDefinitionSchema: z.ZodType<CuratedTemplateDefinition> =
	z.discriminatedUnion("kind", [
		z
			.object({
				kind: z.literal("asset"),
				asset: z.object({
					name: z.string().min(1),
					type: z.string().min(1),
					profile: JsonObjectSchema,
					notes: z.string().optional(),
				}),
			})
			.transform(({ asset }): CuratedTemplateDefinition => {
				const { notes, ...requiredAsset } = asset;
				return {
					kind: "asset",
					asset:
						notes === undefined ? requiredAsset : { ...requiredAsset, notes },
				};
			}),
		z
			.object({
				kind: z.literal("task"),
				task: z.object({
					title: z.string().min(1),
					notes: z.string().optional(),
					assetType: z.string().optional(),
				}),
			})
			.transform(({ task }): CuratedTemplateDefinition => {
				const { notes, assetType, ...requiredTask } = task;
				return {
					kind: "task",
					task: {
						...requiredTask,
						...(notes === undefined ? {} : { notes }),
						...(assetType === undefined ? {} : { assetType }),
					},
				};
			}),
	]);

const CuratedTemplateSchema: z.ZodType<CuratedTemplate> = z.object({
	id: z.string().min(1),
	kind: z.enum(["asset", "task"]),
	category: z.string().min(1),
	title: z.string().min(1),
	description: z.string().nullable(),
	definition: CuratedTemplateDefinitionSchema,
	sortOrder: z.number().int(),
	createdAt: z.string().min(1),
	updatedAt: z.string().min(1),
});

const AssetFileSchema = z.object({
	id: z.string().min(1),
	homeId: z.string().min(1),
	assetId: z.string().min(1),
	kind: z.enum(["photo", "document"]),
	fileName: z.string().min(1),
	contentType: z.string().min(1),
	sizeBytes: z.number().int().positive(),
	uploadedAt: z.string().min(1),
	etag: z.string().nullable(),
	createdAt: z.string().min(1),
	updatedAt: z.string().min(1),
}) satisfies z.ZodType<AssetFile>;

const AssetSchema = z.object({
	id: z.string().min(1),
	homeId: z.string().min(1),
	parentAssetId: z.string().nullable(),
	name: z.string().min(1),
	type: z.string().min(1),
	profile: JsonObjectSchema,
	notes: z.string().nullable(),
	archivedAt: z.string().nullable(),
	createdAt: z.string().min(1),
	updatedAt: z.string().min(1),
}) satisfies z.ZodType<Asset>;

const TaskRecurrenceSchema = z
	.object({
		frequency: z.enum(["daily", "weekly", "monthly", "yearly"]),
		interval: z.number().int().positive(),
		anchor: z.enum(["scheduled_due_date", "completion_date"]).optional(),
	})
	.transform((recurrence) => ({
		...recurrence,
		anchor: recurrence.anchor ?? "scheduled_due_date",
	}));

const TaskSchema = z.object({
	id: z.string().min(1),
	homeId: z.string().min(1),
	assetId: z.string().nullable(),
	title: z.string().min(1),
	notes: z.string().nullable(),
	status: z.enum(["open", "completed"]),
	dueAt: z.string().nullable(),
	recurrence: TaskRecurrenceSchema.nullable()
		.optional()
		.transform((value) => value ?? null),
	completedAt: z.string().nullable(),
	archivedAt: z.string().nullable(),
	createdAt: z.string().min(1),
	updatedAt: z.string().min(1),
}) satisfies z.ZodType<Task>;

const TaskCompletionSchema = z.object({
	id: z.string().min(1),
	taskId: z.string().min(1),
	homeId: z.string().min(1),
	completedByUserId: z.string().min(1),
	completedAt: z.string().min(1),
	notes: z.string().nullable(),
	createdAt: z.string().min(1),
}) satisfies z.ZodType<TaskCompletion>;

const ReminderRuleSchema = z.object({
	frequency: z.enum(["daily", "weekly"]),
	startsBeforeDueDays: z.number().int().min(0).max(3650),
	endsBeforeDueDays: z.number().int().min(0).max(3650),
});

const TaskReminderScheduleSchema = z.object({
	taskId: z.string().min(1),
	userId: z.string().min(1),
	channels: z.array(z.enum(["email", "telegram"])),
	rules: z.array(ReminderRuleSchema),
	createdAt: z.string().min(1),
	updatedAt: z.string().min(1),
}) satisfies z.ZodType<TaskReminderSchedule>;

type ReminderDeliveryHistoryItem =
	ListReminderDeliveryHistorySuccessEnvelope["data"]["items"][number];

const ReminderDeliveryHistoryItemSchema = z.object({
	id: z.string().min(1),
	homeId: z.string().min(1),
	taskId: z.string().min(1),
	taskTitle: z.string().min(1),
	channel: z.enum(["email", "telegram"]),
	scheduledFor: z.string().min(1),
	dueAt: z.string().min(1),
	status: z.enum(["pending", "sending", "sent", "skipped", "failed"]),
	attemptCount: z.number().int().nonnegative(),
	lastError: z.string().nullable(),
	createdAt: z.string().min(1),
	updatedAt: z.string().min(1),
}) satisfies z.ZodType<ReminderDeliveryHistoryItem>;

const NotificationIntegrationSchema: z.ZodType<NotificationIntegration> =
	z.discriminatedUnion("channel", [
		z.object({
			channel: z.literal("email"),
			userId: z.string().min(1),
			status: z.enum(["enabled", "disabled"]),
			config: z.object({
				emailAddress: z.string().min(1),
				deliveryMode: z.enum(["digest", "individual"]).default("digest"),
			}),
			createdAt: z.string().min(1),
			updatedAt: z.string().min(1),
		}),
		z
			.object({
				channel: z.literal("telegram"),
				userId: z.string().min(1),
				status: z.enum(["enabled", "disabled"]),
				config: z.object({
					chatId: z.string().min(1),
					username: z.string().min(1).optional(),
				}),
				createdAt: z.string().min(1),
				updatedAt: z.string().min(1),
			})
			.transform((integration): NotificationIntegration => {
				const { username, ...requiredConfig } = integration.config;
				return {
					...integration,
					config:
						username === undefined
							? requiredConfig
							: { ...requiredConfig, username },
				};
			}),
	]);

export const HealthSuccessEnvelopeSchema = z.object({
	data: z.object({ status: z.literal("ok") }),
}) satisfies z.ZodType<HealthSuccessEnvelope>;
export const CurrentPrincipalSuccessEnvelopeSchema = z.object({
	data: z.object({ user: UserSchema, homes: z.array(HomeSchema) }),
}) satisfies z.ZodType<CurrentPrincipalSuccessEnvelope>;
export const RegisterSuccessEnvelopeSchema = z.object({
	data: z.object({
		user: UserSchema,
		token: z.string().min(1),
		homes: z.array(HomeSchema),
	}),
}) satisfies z.ZodType<RegisterSuccessEnvelope>;
export const RevokeCurrentTokenSuccessEnvelopeSchema = z.object({
	data: z.object({ revokedAt: z.string().min(1) }),
}) satisfies z.ZodType<RevokeCurrentTokenSuccessEnvelope>;
export const RotateCurrentTokenSuccessEnvelopeSchema = z.object({
	data: z.object({ token: z.string().min(1) }),
}) satisfies z.ZodType<RotateCurrentTokenSuccessEnvelope>;
export const CreateApiTokenSuccessEnvelopeSchema = z.object({
	data: z.object({ token: z.string().min(1), apiToken: ApiTokenSchema }),
}) satisfies z.ZodType<CreateApiTokenSuccessEnvelope>;
export const ListApiTokensSuccessEnvelopeSchema = z.object({
	data: z.object({ items: z.array(ApiTokenSchema) }),
}) satisfies z.ZodType<ListApiTokensSuccessEnvelope>;
export const ApiTokenSuccessEnvelopeSchema = z.object({
	data: z.object({ apiToken: ApiTokenSchema }),
}) satisfies z.ZodType<ApiTokenSuccessEnvelope>;

const DeviceLoginResourceScopeSchema = z.enum([
	"profile:read",
	"homes:read",
	"homes:write",
	"assets:read",
	"assets:write",
	"tasks:read",
	"tasks:write",
	"reminders:read",
	"reminders:write",
	"templates:read",
	"templates:write",
	"notifications:read",
	"notifications:write",
	"assistant:read",
	"assistant:write",
	"backup:read",
	"backup:write",
	"tokens:read",
	"tokens:write",
]);

export const DeviceLoginStartSuccessEnvelopeSchema = z.object({
	data: z.object({
		deviceCode: z.string().min(1),
		userCode: z.string().min(1),
		verificationUri: z.string().url(),
		verificationUriComplete: z.string().url(),
		expiresIn: z.number().int().positive(),
		interval: z.number().int().positive(),
	}),
}) satisfies z.ZodType<DeviceLoginStartSuccessEnvelope>;

export const DeviceLoginRequestDetailsSuccessEnvelopeSchema = z.object({
	data: z.object({
		clientName: z.string().min(1),
		clientType: z.enum([
			"cli",
			"automation",
			"dashboard_legacy",
			"integration",
		]),
		requestedScopes: z.array(DeviceLoginResourceScopeSchema),
		requestedExpiresAt: z.string().min(1),
		expiresAt: z.string().min(1),
	}),
}) satisfies z.ZodType<DeviceLoginRequestDetailsSuccessEnvelope>;

export const DeviceLoginStatusSuccessEnvelopeSchema = z.object({
	data: z.object({ status: z.enum(["approved", "denied"]) }),
}) satisfies z.ZodType<DeviceLoginStatusSuccessEnvelope>;

export const DeviceLoginTokenSuccessEnvelopeSchema = z.object({
	data: z.discriminatedUnion("status", [
		z.object({
			status: z.literal("authorization_pending"),
			interval: z.number().int().positive(),
		}),
		z.object({
			status: z.literal("approved"),
			accessToken: z.string().min(1),
			tokenType: z.literal("Bearer"),
			expiresAt: z.string().min(1),
			scopes: z.array(DeviceLoginResourceScopeSchema),
		}),
	]),
}) satisfies z.ZodType<DeviceLoginTokenSuccessEnvelope>;

export const ListNotificationIntegrationsSuccessEnvelopeSchema = z.object({
	data: z.object({ items: z.array(NotificationIntegrationSchema) }),
}) satisfies z.ZodType<ListNotificationIntegrationsSuccessEnvelope>;
export const NotificationIntegrationSuccessEnvelopeSchema = z.object({
	data: z.object({ integration: NotificationIntegrationSchema }),
}) satisfies z.ZodType<NotificationIntegrationSuccessEnvelope>;
export const ListHomesSuccessEnvelopeSchema = z.object({
	data: z.object({ items: z.array(HomeSchema) }),
}) satisfies z.ZodType<ListHomesSuccessEnvelope>;
export const CreateHomeSuccessEnvelopeSchema = z.object({
	data: z.object({ home: HomeSchema }),
}) satisfies z.ZodType<CreateHomeSuccessEnvelope>;
const HomeMembershipSchema = z.object({
	id: z.string().min(1),
	homeId: z.string().min(1),
	role: z.literal("owner"),
	user: UserSchema,
});

export const ListHomeMembershipsSuccessEnvelopeSchema = z.object({
	data: z.object({
		items: z.array(HomeMembershipSchema),
	}),
}) satisfies z.ZodType<ListHomeMembershipsSuccessEnvelope>;
export const HomeMembershipSuccessEnvelopeSchema = z.object({
	data: z.object({ membership: HomeMembershipSchema }),
}) satisfies z.ZodType<HomeMembershipSuccessEnvelope>;
export const HomeSummarySuccessEnvelopeSchema = z.object({
	data: z.object({
		homeId: z.string().min(1),
		counts: z.object({
			assets: z.object({
				total: CountSchema,
				active: CountSchema,
				archived: CountSchema,
			}),
			tasks: z.object({
				total: CountSchema,
				open: CountSchema,
				completed: CountSchema,
				archived: CountSchema,
			}),
			due: z.object({
				overdue: CountSchema,
				dueToday: CountSchema,
				dueThisWeek: CountSchema,
				upcoming: CountSchema,
				unscheduled: CountSchema,
			}),
		}),
	}),
}) satisfies z.ZodType<HomeSummarySuccessEnvelope>;
export const ListReminderDeliveryHistorySuccessEnvelopeSchema = z.object({
	data: z.object({ items: z.array(ReminderDeliveryHistoryItemSchema) }),
}) satisfies z.ZodType<ListReminderDeliveryHistorySuccessEnvelope>;
export const ListCuratedTemplatesSuccessEnvelopeSchema = z.object({
	data: z.object({ items: z.array(CuratedTemplateSchema) }),
}) satisfies z.ZodType<ListCuratedTemplatesSuccessEnvelope>;
export const CuratedTemplateSuccessEnvelopeSchema = z.object({
	data: z.object({ template: CuratedTemplateSchema }),
}) satisfies z.ZodType<CuratedTemplateSuccessEnvelope>;
export const ListCuratedTemplateRecommendationsSuccessEnvelopeSchema = z.object(
	{
		data: z.object({
			items: z.array(
				z.object({
					template: CuratedTemplateSchema,
					reason: z.discriminatedUnion("type", [
						z.object({
							type: z.literal("asset_type_match"),
							assetType: z.string().min(1),
							assetIds: z.array(z.string().min(1)),
						}),
						z.object({ type: z.literal("general_home_safety") }),
					]),
				}),
			),
		}),
	},
) satisfies z.ZodType<ListCuratedTemplateRecommendationsSuccessEnvelope>;
export const TemplateInstantiationSuccessEnvelopeSchema = z.object({
	data: z.discriminatedUnion("kind", [
		z.object({ kind: z.literal("asset"), asset: AssetSchema }),
		z.object({ kind: z.literal("task"), task: TaskSchema }),
	]),
}) satisfies z.ZodType<TemplateInstantiationSuccessEnvelope>;
export const ListAssetsSuccessEnvelopeSchema = z.object({
	data: z.object({ items: z.array(AssetSchema) }),
}) satisfies z.ZodType<ListAssetsSuccessEnvelope>;
export const CreateAssetSuccessEnvelopeSchema = z.object({
	data: z.object({ asset: AssetSchema }),
}) satisfies z.ZodType<CreateAssetSuccessEnvelope>;
export const AssetSuccessEnvelopeSchema = z.object({
	data: z.object({ asset: AssetSchema }),
}) satisfies z.ZodType<AssetSuccessEnvelope>;
export const ListAssetFilesSuccessEnvelopeSchema = z.object({
	data: z.object({ items: z.array(AssetFileSchema) }),
}) satisfies z.ZodType<ListAssetFilesSuccessEnvelope>;
export const UploadAssetFileSuccessEnvelopeSchema = z.object({
	data: z.object({ file: AssetFileSchema }),
}) satisfies z.ZodType<UploadAssetFileSuccessEnvelope>;
export const ListTasksSuccessEnvelopeSchema = z.object({
	data: z.object({ items: z.array(TaskSchema) }),
}) satisfies z.ZodType<ListTasksSuccessEnvelope>;

const HomeBackupTaskCompletionSchema = z.object({
	id: z.string().min(1),
	taskId: z.string().min(1),
	completedByUserId: z.string().min(1),
	completedAt: z.string().min(1),
	notes: z.string().nullable(),
	createdAt: z.string().min(1),
});

export const HomeBackupSuccessEnvelopeSchema = z.object({
	data: z.object({
		kind: z.literal("homestead.backup"),
		schemaVersion: z.literal(1),
		exportedAt: z.string().min(1),
		home: z.object({ id: z.string().min(1), name: z.string().min(1) }),
		assets: z.array(AssetSchema.omit({ homeId: true })),
		tasks: z.array(TaskSchema.omit({ homeId: true })),
		taskCompletions: z.array(HomeBackupTaskCompletionSchema),
	}),
}) satisfies z.ZodType<HomeBackupSuccessEnvelope>;

const BulkApplyErrorSchema = z.discriminatedUnion("type", [
	z.object({
		type: z.literal("duplicate_client_ref"),
		clientRef: z.string().min(1),
	}),
	z.object({
		type: z.literal("unknown_created_asset_ref"),
		clientRef: z.string().min(1),
	}),
	z.object({
		type: z.literal("forward_created_asset_ref"),
		clientRef: z.string().min(1),
	}),
	z.object({
		type: z.literal("existing_asset_not_found"),
		assetId: z.string().min(1),
	}),
	z.object({ type: z.literal("invalid_task"), message: z.string().min(1) }),
]);

const BulkApplyOperationPreviewSchema = z
	.object({
		index: z.number().int().nonnegative(),
		kind: z.enum(["create_asset", "create_task"]),
		clientRef: z.string().min(1).optional(),
		summary: z.string().min(1),
	})
	.transform((operation) => {
		const { clientRef, ...requiredOperation } = operation;
		return clientRef === undefined
			? requiredOperation
			: { ...requiredOperation, clientRef };
	});

export const BulkApplyPreviewSuccessEnvelopeSchema = z.object({
	data: z.discriminatedUnion("status", [
		z.object({
			status: z.literal("valid"),
			plan: z.object({
				homeId: z.string().min(1),
				operations: z.array(BulkApplyOperationPreviewSchema),
			}),
		}),
		z.object({
			status: z.literal("invalid"),
			errors: z.array(BulkApplyErrorSchema),
		}),
	]),
}) satisfies z.ZodType<BulkApplyPreviewSuccessEnvelope>;

export const BulkApplySuccessEnvelopeSchema = z.object({
	data: z.object({
		homeId: z.string().min(1),
		created: z.object({
			assets: z.array(AssetSchema),
			tasks: z.array(TaskSchema),
		}),
	}),
}) satisfies z.ZodType<BulkApplySuccessEnvelope>;

const AgentActionSchema = z.discriminatedUnion("kind", [
	z.object({
		kind: z.literal("list_assets"),
		homeId: z.string().min(1),
		filters: z
			.object({
				type: z.string().min(1).optional(),
				status: z.enum(["active", "archived"]).optional(),
			})
			.optional(),
	}),
	z.object({
		kind: z.literal("list_tasks"),
		homeId: z.string().min(1),
		filters: z
			.object({
				assetId: z.string().min(1).optional(),
				status: z.enum(["open", "completed", "archived"]).optional(),
			})
			.optional(),
	}),
	z.object({
		kind: z.literal("create_asset"),
		homeId: z.string().min(1),
		body: z.object({
			parentAssetId: z.string().min(1).optional(),
			name: z.string().min(1),
			type: z.string().min(1),
			notes: z.string().min(1).optional(),
		}),
	}),
	z.object({
		kind: z.literal("create_task"),
		homeId: z.string().min(1),
		body: z.object({
			assetId: z.string().min(1).optional(),
			title: z.string().min(1),
			notes: z.string().min(1).optional(),
			dueAt: z.string().min(1).optional(),
			recurrence: TaskRecurrenceSchema.optional(),
		}),
	}),
	z.object({
		kind: z.literal("complete_task"),
		homeId: z.string().min(1),
		taskId: z.string().min(1),
		notes: z.string().min(1).optional(),
	}),
	z.object({
		kind: z.literal("reschedule_task"),
		homeId: z.string().min(1),
		taskId: z.string().min(1),
		dueAt: z.string().min(1).nullable(),
		recurrence: TaskRecurrenceSchema.nullable().optional(),
	}),
]);

const AgentPlanSchema = z.object({
	id: z.string().min(1),
	homeId: z.string().min(1),
	status: z.enum([
		"pending_approval",
		"approved",
		"executed",
		"rejected",
		"failed",
	]),
	actions: z.tuple([AgentActionSchema]),
	summary: z.string().min(1),
	createdAt: z.string().min(1),
	updatedAt: z.string().min(1),
});

export const AgentMessageSuccessEnvelopeSchema = z.object({
	data: z.discriminatedUnion("kind", [
		z.object({
			kind: z.literal("answer"),
			message: z.string().min(1),
			assets: z.array(AssetSchema).optional(),
			tasks: z.array(TaskSchema).optional(),
		}),
		z.object({ kind: z.literal("pending_approval"), plan: AgentPlanSchema }),
	]),
}) satisfies z.ZodType<AgentMessageSuccessEnvelope>;

const AgentActionExecutionResultSchema = z.discriminatedUnion("kind", [
	z.object({ kind: z.literal("created_asset"), asset: AssetSchema }),
	z.object({ kind: z.literal("created_task"), task: TaskSchema }),
	z.object({ kind: z.literal("completed_task"), task: TaskSchema }),
	z.object({ kind: z.literal("rescheduled_task"), task: TaskSchema }),
]);

export const AgentPlanApprovalSuccessEnvelopeSchema = z.object({
	data: z.object({
		kind: z.literal("executed"),
		plan: AgentPlanSchema,
		results: z.array(AgentActionExecutionResultSchema),
	}),
}) satisfies z.ZodType<AgentPlanApprovalSuccessEnvelope>;

export const AgentPlanRejectionSuccessEnvelopeSchema = z.object({
	data: z.object({ kind: z.literal("rejected"), plan: AgentPlanSchema }),
}) satisfies z.ZodType<AgentPlanRejectionSuccessEnvelope>;
export const CreateTaskSuccessEnvelopeSchema = z.object({
	data: z.object({ task: TaskSchema }),
}) satisfies z.ZodType<CreateTaskSuccessEnvelope>;
export const TaskSuccessEnvelopeSchema = z.object({
	data: z.object({ task: TaskSchema }),
}) satisfies z.ZodType<TaskSuccessEnvelope>;
export const TaskReminderScheduleSuccessEnvelopeSchema = z.object({
	data: z.object({ schedule: TaskReminderScheduleSchema.nullable() }),
}) satisfies z.ZodType<TaskReminderScheduleSuccessEnvelope>;
export const ListTaskCompletionsSuccessEnvelopeSchema = z.object({
	data: z.object({ items: z.array(TaskCompletionSchema) }),
}) satisfies z.ZodType<ListTaskCompletionsSuccessEnvelope>;
export const CompleteTaskSuccessEnvelopeSchema = z.object({
	data: z.object({ task: TaskSchema, completion: TaskCompletionSchema }),
}) satisfies z.ZodType<CompleteTaskSuccessEnvelope>;
