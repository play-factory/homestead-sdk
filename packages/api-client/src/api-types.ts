import type { components } from "./generated/openapi.js";
import type { ApiClientError } from "./core/errors.js";
import type { Result } from "./core/result.js";

export type ClientResult<T> = Promise<Result<T, ApiClientError>>;

export type HealthSuccessEnvelope =
	components["schemas"]["HealthSuccessEnvelope"];
export type CurrentPrincipalSuccessEnvelope =
	components["schemas"]["CurrentPrincipalSuccessEnvelope"];
export type RegisterRequestBody = components["schemas"]["RegisterRequestBody"];
export type RegisterSuccessEnvelope =
	components["schemas"]["RegisterSuccessEnvelope"];
export type RevokeCurrentTokenSuccessEnvelope =
	components["schemas"]["RevokeCurrentTokenSuccessEnvelope"];
export type RotateCurrentTokenSuccessEnvelope =
	components["schemas"]["RotateCurrentTokenSuccessEnvelope"];
export type ApiToken = components["schemas"]["ApiToken"];
export type CreateApiTokenRequestBody =
	components["schemas"]["CreateApiTokenRequestBody"];
export type CreateApiTokenSuccessEnvelope =
	components["schemas"]["CreateApiTokenSuccessEnvelope"];
export type ListApiTokensSuccessEnvelope =
	components["schemas"]["ListApiTokensSuccessEnvelope"];
export type ApiTokenSuccessEnvelope =
	components["schemas"]["ApiTokenSuccessEnvelope"];
export type DeviceLoginStartRequestBody =
	components["schemas"]["DeviceLoginStartRequestBody"];
export type DeviceLoginStartSuccessEnvelope =
	components["schemas"]["DeviceLoginStartSuccessEnvelope"];
export type DeviceLoginRequestDetailsSuccessEnvelope =
	components["schemas"]["DeviceLoginRequestDetailsSuccessEnvelope"];
export type DeviceLoginApproveRequestBody =
	components["schemas"]["DeviceLoginApproveRequestBody"];
export type DeviceLoginDenyRequestBody =
	components["schemas"]["DeviceLoginDenyRequestBody"];
export type DeviceLoginStatusSuccessEnvelope =
	components["schemas"]["DeviceLoginStatusSuccessEnvelope"];
export type DeviceLoginTokenRequestBody =
	components["schemas"]["DeviceLoginTokenRequestBody"];
export type DeviceLoginTokenSuccessEnvelope =
	components["schemas"]["DeviceLoginTokenSuccessEnvelope"];
export type ListNotificationIntegrationsSuccessEnvelope =
	components["schemas"]["ListNotificationIntegrationsSuccessEnvelope"];
export type NotificationIntegrationSuccessEnvelope =
	components["schemas"]["NotificationIntegrationSuccessEnvelope"];
export type PutEmailNotificationIntegrationRequestBody =
	components["schemas"]["PutEmailNotificationIntegrationRequestBody"];
export type PutTelegramNotificationIntegrationRequestBody =
	components["schemas"]["PutTelegramNotificationIntegrationRequestBody"];
export type ListHomesSuccessEnvelope =
	components["schemas"]["ListHomesSuccessEnvelope"];
export type CreateHomeRequestBody =
	components["schemas"]["CreateHomeRequestBody"];
export type CreateHomeSuccessEnvelope =
	components["schemas"]["CreateHomeSuccessEnvelope"];
export type ListHomeMembershipsSuccessEnvelope =
	components["schemas"]["ListHomeMembershipsSuccessEnvelope"];
export type HomeMembershipSuccessEnvelope =
	components["schemas"]["HomeMembershipSuccessEnvelope"];
export type HomeSummarySuccessEnvelope =
	components["schemas"]["HomeSummarySuccessEnvelope"];
export type HomeBackupSuccessEnvelope =
	components["schemas"]["HomeBackupSuccessEnvelope"];
export type BulkApplyRequestBody =
	components["schemas"]["BulkApplyRequestBody"];
export type BulkApplyPreviewSuccessEnvelope =
	components["schemas"]["BulkApplyPreviewSuccessEnvelope"];
export type BulkApplySuccessEnvelope =
	components["schemas"]["BulkApplySuccessEnvelope"];
export type ListReminderDeliveryHistorySuccessEnvelope =
	components["schemas"]["ListReminderDeliveryHistorySuccessEnvelope"];
export type ListCuratedTemplatesSuccessEnvelope =
	components["schemas"]["ListCuratedTemplatesSuccessEnvelope"];
export type CuratedTemplateSuccessEnvelope =
	components["schemas"]["CuratedTemplateSuccessEnvelope"];
export type ListCuratedTemplateRecommendationsSuccessEnvelope =
	components["schemas"]["ListCuratedTemplateRecommendationsSuccessEnvelope"];
export type InstantiateTemplateRequestBody =
	components["schemas"]["InstantiateTemplateRequestBody"];
export type TemplateInstantiationSuccessEnvelope =
	components["schemas"]["TemplateInstantiationSuccessEnvelope"];
export type ListAssetsSuccessEnvelope =
	components["schemas"]["ListAssetsSuccessEnvelope"];
export type CreateAssetRequestBody =
	components["schemas"]["CreateAssetRequestBody"];
export type CreateAssetSuccessEnvelope =
	components["schemas"]["CreateAssetSuccessEnvelope"];
export type AssetSuccessEnvelope =
	components["schemas"]["AssetSuccessEnvelope"];
export type AssetFileKind = "photo" | "document";
export type AssetFile = {
	readonly id: string;
	readonly homeId: string;
	readonly assetId: string;
	readonly kind: AssetFileKind;
	readonly fileName: string;
	readonly contentType: string;
	readonly sizeBytes: number;
	readonly uploadedAt: string;
	readonly etag: string | null;
	readonly createdAt: string;
	readonly updatedAt: string;
};
export type ListAssetFilesSuccessEnvelope = {
	readonly data: { readonly items: readonly AssetFile[] };
};
export type UploadAssetFileSuccessEnvelope = {
	readonly data: { readonly file: AssetFile };
};
export type PatchAssetRequestBody =
	components["schemas"]["PatchAssetRequestBody"];
export type ListTasksSuccessEnvelope =
	components["schemas"]["ListTasksSuccessEnvelope"];
export type PostAgentMessageRequestBody =
	components["schemas"]["PostAgentMessageRequestBody"];
export type AgentCreateTaskBody = {
	readonly assetId?: string | undefined;
	readonly title: string;
	readonly notes?: string | undefined;
	readonly dueAt?: string | undefined;
	readonly recurrence?: components["schemas"]["TaskRecurrence"] | undefined;
};
export type AgentCreateAssetBody = {
	readonly parentAssetId?: string | undefined;
	readonly name: string;
	readonly type: string;
	readonly notes?: string | undefined;
};
export type AgentAction =
	| {
			readonly kind: "list_assets";
			readonly homeId: string;
			readonly filters?:
				| {
						readonly type?: string | undefined;
						readonly status?: "active" | "archived" | undefined;
				  }
				| undefined;
	  }
	| {
			readonly kind: "list_tasks";
			readonly homeId: string;
			readonly filters?:
				| {
						readonly assetId?: string | undefined;
						readonly status?: "open" | "completed" | "archived" | undefined;
				  }
				| undefined;
	  }
	| {
			readonly kind: "create_asset";
			readonly homeId: string;
			readonly body: AgentCreateAssetBody;
	  }
	| {
			readonly kind: "create_task";
			readonly homeId: string;
			readonly body: AgentCreateTaskBody;
	  }
	| {
			readonly kind: "complete_task";
			readonly homeId: string;
			readonly taskId: string;
			readonly notes?: string | undefined;
	  }
	| {
			readonly kind: "reschedule_task";
			readonly homeId: string;
			readonly taskId: string;
			readonly dueAt: string | null;
			readonly recurrence?:
				| components["schemas"]["TaskRecurrence"]
				| null
				| undefined;
	  };
export type AgentPlan = {
	readonly id: string;
	readonly homeId: string;
	readonly status:
		| "pending_approval"
		| "approved"
		| "executed"
		| "rejected"
		| "failed";
	readonly actions: readonly [AgentAction];
	readonly summary: string;
	readonly createdAt: string;
	readonly updatedAt: string;
};
export type AgentMessageSuccessEnvelope = {
	readonly data:
		| {
				readonly kind: "answer";
				readonly message: string;
				readonly assets?:
					| readonly AssetSuccessEnvelope["data"]["asset"][]
					| undefined;
				readonly tasks?:
					| readonly TaskSuccessEnvelope["data"]["task"][]
					| undefined;
		  }
		| { readonly kind: "pending_approval"; readonly plan: AgentPlan };
};
export type AgentActionExecutionResult =
	| {
			readonly kind: "created_asset";
			readonly asset: AssetSuccessEnvelope["data"]["asset"];
	  }
	| {
			readonly kind: "created_task";
			readonly task: TaskSuccessEnvelope["data"]["task"];
	  }
	| {
			readonly kind: "completed_task";
			readonly task: TaskSuccessEnvelope["data"]["task"];
	  }
	| {
			readonly kind: "rescheduled_task";
			readonly task: TaskSuccessEnvelope["data"]["task"];
	  };
export type AgentPlanApprovalSuccessEnvelope = {
	readonly data: {
		readonly kind: "executed";
		readonly plan: AgentPlan;
		readonly results: readonly AgentActionExecutionResult[];
	};
};
export type AgentPlanRejectionSuccessEnvelope = {
	readonly data: { readonly kind: "rejected"; readonly plan: AgentPlan };
};
export type CreateTaskRequestBody =
	components["schemas"]["CreateTaskRequestBody"];
export type CreateTaskSuccessEnvelope =
	components["schemas"]["CreateTaskSuccessEnvelope"];
export type TaskSuccessEnvelope = components["schemas"]["TaskSuccessEnvelope"];
export type PatchTaskRequestBody =
	components["schemas"]["PatchTaskRequestBody"];
export type PutTaskReminderScheduleRequestBody =
	components["schemas"]["PutTaskReminderScheduleRequestBody"];
export type TaskReminderScheduleSuccessEnvelope =
	components["schemas"]["TaskReminderScheduleSuccessEnvelope"];
export type ListTaskCompletionsSuccessEnvelope =
	components["schemas"]["ListTaskCompletionsSuccessEnvelope"];
export type CreateTaskCompletionRequestBody =
	components["schemas"]["CreateTaskCompletionRequestBody"];
export type CompleteTaskSuccessEnvelope =
	components["schemas"]["CompleteTaskSuccessEnvelope"];

export type HomeIdInput = { readonly homeId: string };
export type AssetIdInput = { readonly assetId: string };
export type TaskIdInput = { readonly taskId: string };
export type AgentPlanIdInput = { readonly planId: string };
export type TemplateIdInput = { readonly templateId: string };
export type NotificationChannelInput = {
	readonly channel: "email" | "telegram";
};

export type ListAssetsInput = HomeIdInput & {
	readonly query?: {
		readonly type?: string;
		readonly status?: "active" | "archived";
	};
};
export type ListAssetFilesInput = HomeIdInput & {
	readonly query?: {
		readonly assetId?: string;
		readonly kind?: AssetFileKind;
	};
};
export type UploadAssetFileInput = AssetIdInput & {
	readonly body: {
		readonly kind: AssetFileKind;
		readonly file: File | Blob;
		readonly fileName?: string;
	};
};
export type ListTasksInput = HomeIdInput & {
	readonly query?: {
		readonly assetId?: string;
		readonly status?: "open" | "completed" | "archived";
	};
};
export type ListReminderDeliveryHistoryInput = HomeIdInput & {
	readonly query?: {
		readonly status?: "pending" | "sending" | "sent" | "skipped" | "failed";
		readonly channel?: "email" | "telegram";
		readonly taskId?: string;
		readonly scheduledFrom?: string;
		readonly scheduledTo?: string;
		readonly limit?: number;
	};
};
export type ListCuratedTemplatesInput = {
	readonly query?: {
		readonly kind?: "asset" | "task";
		readonly category?: string;
	};
};
