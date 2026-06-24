import { z } from "zod";

import type {
	AgentMessageSuccessEnvelope,
	AgentPlanApprovalSuccessEnvelope,
	AgentPlanIdInput,
	AgentPlanRejectionSuccessEnvelope,
	ApiTokenSuccessEnvelope,
	AssetIdInput,
	AssetSuccessEnvelope,
	BulkApplyPreviewSuccessEnvelope,
	BulkApplyRequestBody,
	BulkApplySuccessEnvelope,
	ClientResult,
	CompleteTaskSuccessEnvelope,
	CreateApiTokenRequestBody,
	CreateApiTokenSuccessEnvelope,
	CreateAssetRequestBody,
	CreateAssetSuccessEnvelope,
	CreateHomeRequestBody,
	CreateHomeSuccessEnvelope,
	CreateTaskCompletionRequestBody,
	CreateTaskRequestBody,
	CreateTaskSuccessEnvelope,
	CurrentPrincipalSuccessEnvelope,
	CuratedTemplateSuccessEnvelope,
	DeviceLoginApproveRequestBody,
	DeviceLoginDenyRequestBody,
	DeviceLoginRequestDetailsSuccessEnvelope,
	DeviceLoginStartRequestBody,
	DeviceLoginStartSuccessEnvelope,
	DeviceLoginStatusSuccessEnvelope,
	DeviceLoginTokenRequestBody,
	DeviceLoginTokenSuccessEnvelope,
	HealthSuccessEnvelope,
	HomeBackupSuccessEnvelope,
	HomeIdInput,
	HomeMembershipSuccessEnvelope,
	HomeSummarySuccessEnvelope,
	InstantiateTemplateRequestBody,
	ListApiTokensSuccessEnvelope,
	ListAssetFilesInput,
	ListAssetFilesSuccessEnvelope,
	ListAssetsInput,
	ListAssetsSuccessEnvelope,
	ListReminderDeliveryHistoryInput,
	ListReminderDeliveryHistorySuccessEnvelope,
	ListNotificationIntegrationsSuccessEnvelope,
	ListCuratedTemplateRecommendationsSuccessEnvelope,
	ListCuratedTemplatesInput,
	ListCuratedTemplatesSuccessEnvelope,
	ListHomeMembershipsSuccessEnvelope,
	ListHomesSuccessEnvelope,
	ListTaskCompletionsSuccessEnvelope,
	ListTasksInput,
	ListTasksSuccessEnvelope,
	NotificationChannelInput,
	NotificationIntegrationSuccessEnvelope,
	PatchAssetRequestBody,
	PatchTaskRequestBody,
	PostAgentMessageRequestBody,
	UploadAssetFileInput,
	UploadAssetFileSuccessEnvelope,
	PutEmailNotificationIntegrationRequestBody,
	PutTaskReminderScheduleRequestBody,
	PutTelegramNotificationIntegrationRequestBody,
	RegisterRequestBody,
	RegisterSuccessEnvelope,
	RevokeCurrentTokenSuccessEnvelope,
	RotateCurrentTokenSuccessEnvelope,
	TaskIdInput,
	TaskReminderScheduleSuccessEnvelope,
	TaskSuccessEnvelope,
	TemplateIdInput,
	TemplateInstantiationSuccessEnvelope,
} from "./api-types.js";
import { type ApiAuth, normalizeApiBaseUrl } from "./core/config.js";
import type { ApiClientError } from "./core/errors.js";
import { buildJsonRequestSpec, type HttpMethod } from "./core/request.js";
import { parseHttpResponse } from "./core/response.js";
import { error, type Result } from "./core/result.js";
import {
	AgentMessageSuccessEnvelopeSchema,
	AgentPlanApprovalSuccessEnvelopeSchema,
	ApiTokenSuccessEnvelopeSchema,
	AgentPlanRejectionSuccessEnvelopeSchema,
	AssetSuccessEnvelopeSchema,
	BulkApplyPreviewSuccessEnvelopeSchema,
	BulkApplySuccessEnvelopeSchema,
	CompleteTaskSuccessEnvelopeSchema,
	CreateApiTokenSuccessEnvelopeSchema,
	CreateAssetSuccessEnvelopeSchema,
	CreateTaskSuccessEnvelopeSchema,
	CurrentPrincipalSuccessEnvelopeSchema,
	CuratedTemplateSuccessEnvelopeSchema,
	DeviceLoginRequestDetailsSuccessEnvelopeSchema,
	DeviceLoginStartSuccessEnvelopeSchema,
	DeviceLoginStatusSuccessEnvelopeSchema,
	DeviceLoginTokenSuccessEnvelopeSchema,
	HealthSuccessEnvelopeSchema,
	HomeBackupSuccessEnvelopeSchema,
	HomeMembershipSuccessEnvelopeSchema,
	HomeSummarySuccessEnvelopeSchema,
	CreateHomeSuccessEnvelopeSchema,
	ListApiTokensSuccessEnvelopeSchema,
	ListAssetFilesSuccessEnvelopeSchema,
	ListAssetsSuccessEnvelopeSchema,
	ListReminderDeliveryHistorySuccessEnvelopeSchema,
	ListCuratedTemplateRecommendationsSuccessEnvelopeSchema,
	ListNotificationIntegrationsSuccessEnvelopeSchema,
	ListCuratedTemplatesSuccessEnvelopeSchema,
	ListHomeMembershipsSuccessEnvelopeSchema,
	ListHomesSuccessEnvelopeSchema,
	ListTaskCompletionsSuccessEnvelopeSchema,
	ListTasksSuccessEnvelopeSchema,
	NotificationIntegrationSuccessEnvelopeSchema,
	RegisterSuccessEnvelopeSchema,
	RevokeCurrentTokenSuccessEnvelopeSchema,
	RotateCurrentTokenSuccessEnvelopeSchema,
	TaskReminderScheduleSuccessEnvelopeSchema,
	TaskSuccessEnvelopeSchema,
	TemplateInstantiationSuccessEnvelopeSchema,
	UploadAssetFileSuccessEnvelopeSchema,
} from "./response-schemas.js";

export type FetchLike = (
	input: string,
	init?: RequestInit,
) => Promise<Response>;

export type HomeMembershipIdInput = {
	readonly homeId: string;
	readonly membershipId: string;
};

export type HomesteadApiClientConfig = {
	readonly baseUrl: string;
	readonly auth: ApiAuth;
	readonly fetch?: FetchLike;
};

export type HomesteadApiClient = {
	readonly getHealth: () => ClientResult<HealthSuccessEnvelope>;
	readonly getCurrentPrincipal: () => ClientResult<CurrentPrincipalSuccessEnvelope>;
	readonly registerUser: (
		body: RegisterRequestBody,
	) => ClientResult<RegisterSuccessEnvelope>;
	readonly revokeCurrentToken: () => ClientResult<RevokeCurrentTokenSuccessEnvelope>;
	readonly rotateCurrentToken: () => ClientResult<RotateCurrentTokenSuccessEnvelope>;
	readonly listApiTokens: () => ClientResult<ListApiTokensSuccessEnvelope>;
	readonly createApiToken: (
		body: CreateApiTokenRequestBody,
	) => ClientResult<CreateApiTokenSuccessEnvelope>;
	readonly revokeApiToken: (input: {
		readonly tokenId: string;
	}) => ClientResult<ApiTokenSuccessEnvelope>;
	readonly startDeviceLogin: (
		body: DeviceLoginStartRequestBody,
	) => ClientResult<DeviceLoginStartSuccessEnvelope>;
	readonly getDeviceLoginRequest: (input: {
		readonly userCode: string;
	}) => ClientResult<DeviceLoginRequestDetailsSuccessEnvelope>;
	readonly approveDeviceLogin: (
		body: DeviceLoginApproveRequestBody,
	) => ClientResult<DeviceLoginStatusSuccessEnvelope>;
	readonly denyDeviceLogin: (
		body: DeviceLoginDenyRequestBody,
	) => ClientResult<DeviceLoginStatusSuccessEnvelope>;
	readonly pollDeviceLoginToken: (
		body: DeviceLoginTokenRequestBody,
	) => ClientResult<DeviceLoginTokenSuccessEnvelope>;
	readonly postAgentMessage: (
		body: PostAgentMessageRequestBody,
	) => ClientResult<AgentMessageSuccessEnvelope>;
	readonly postAgentMessageStream: (
		body: PostAgentMessageRequestBody,
	) => ClientResult<AgentMessageSuccessEnvelope>;
	readonly approveAgentPlan: (
		input: AgentPlanIdInput,
	) => ClientResult<AgentPlanApprovalSuccessEnvelope>;
	readonly rejectAgentPlan: (
		input: AgentPlanIdInput,
	) => ClientResult<AgentPlanRejectionSuccessEnvelope>;
	readonly listNotificationIntegrations: () => ClientResult<ListNotificationIntegrationsSuccessEnvelope>;
	readonly putEmailNotificationIntegration: (
		body: PutEmailNotificationIntegrationRequestBody,
	) => ClientResult<NotificationIntegrationSuccessEnvelope>;
	readonly putTelegramNotificationIntegration: (
		body: PutTelegramNotificationIntegrationRequestBody,
	) => ClientResult<NotificationIntegrationSuccessEnvelope>;
	readonly deleteNotificationIntegration: (
		input: NotificationChannelInput,
	) => ClientResult<void>;
	readonly listHomes: () => ClientResult<ListHomesSuccessEnvelope>;
	readonly createHome: (
		body: CreateHomeRequestBody,
	) => ClientResult<CreateHomeSuccessEnvelope>;
	readonly listHomeMemberships: (
		input: HomeIdInput,
	) => ClientResult<ListHomeMembershipsSuccessEnvelope>;
	readonly deleteHomeMembership: (
		input: HomeMembershipIdInput,
	) => ClientResult<HomeMembershipSuccessEnvelope>;
	readonly getHomeSummary: (
		input: HomeIdInput,
	) => ClientResult<HomeSummarySuccessEnvelope>;
	readonly exportHomeBackup: (
		input: HomeIdInput,
	) => ClientResult<HomeBackupSuccessEnvelope>;
	readonly previewBulkApply: (input: {
		readonly homeId: string;
		readonly body: BulkApplyRequestBody;
	}) => ClientResult<BulkApplyPreviewSuccessEnvelope>;
	readonly applyBulk: (input: {
		readonly homeId: string;
		readonly body: BulkApplyRequestBody;
	}) => ClientResult<BulkApplySuccessEnvelope>;
	readonly listReminderDeliveryHistory: (
		input: ListReminderDeliveryHistoryInput,
	) => ClientResult<ListReminderDeliveryHistorySuccessEnvelope>;
	readonly listCuratedTemplates: (
		input?: ListCuratedTemplatesInput,
	) => ClientResult<ListCuratedTemplatesSuccessEnvelope>;
	readonly getCuratedTemplate: (
		input: TemplateIdInput,
	) => ClientResult<CuratedTemplateSuccessEnvelope>;
	readonly listCuratedTemplateRecommendations: (
		input: HomeIdInput,
	) => ClientResult<ListCuratedTemplateRecommendationsSuccessEnvelope>;
	readonly instantiateCuratedTemplate: (input: {
		readonly homeId: string;
		readonly templateId: string;
		readonly body: InstantiateTemplateRequestBody;
	}) => ClientResult<TemplateInstantiationSuccessEnvelope>;
	readonly listAssets: (
		input: ListAssetsInput,
	) => ClientResult<ListAssetsSuccessEnvelope>;
	readonly createAsset: (input: {
		readonly homeId: string;
		readonly body: CreateAssetRequestBody;
	}) => ClientResult<CreateAssetSuccessEnvelope>;
	readonly getAsset: (
		input: AssetIdInput,
	) => ClientResult<AssetSuccessEnvelope>;
	readonly patchAsset: (input: {
		readonly assetId: string;
		readonly body: PatchAssetRequestBody;
	}) => ClientResult<AssetSuccessEnvelope>;
	readonly archiveAsset: (
		input: AssetIdInput,
	) => ClientResult<AssetSuccessEnvelope>;
	readonly listAssetFiles: (
		input: ListAssetFilesInput,
	) => ClientResult<ListAssetFilesSuccessEnvelope>;
	readonly uploadAssetFile: (
		input: UploadAssetFileInput,
	) => ClientResult<UploadAssetFileSuccessEnvelope>;
	readonly listTasks: (
		input: ListTasksInput,
	) => ClientResult<ListTasksSuccessEnvelope>;
	readonly createTask: (input: {
		readonly homeId: string;
		readonly body: CreateTaskRequestBody;
	}) => ClientResult<CreateTaskSuccessEnvelope>;
	readonly getTask: (input: TaskIdInput) => ClientResult<TaskSuccessEnvelope>;
	readonly patchTask: (input: {
		readonly taskId: string;
		readonly body: PatchTaskRequestBody;
	}) => ClientResult<TaskSuccessEnvelope>;
	readonly archiveTask: (
		input: TaskIdInput,
	) => ClientResult<TaskSuccessEnvelope>;
	readonly getTaskReminderSchedule: (
		input: TaskIdInput,
	) => ClientResult<TaskReminderScheduleSuccessEnvelope>;
	readonly putTaskReminderSchedule: (input: {
		readonly taskId: string;
		readonly body: PutTaskReminderScheduleRequestBody;
	}) => ClientResult<TaskReminderScheduleSuccessEnvelope>;
	readonly deleteTaskReminderSchedule: (
		input: TaskIdInput,
	) => ClientResult<void>;
	readonly listTaskCompletions: (
		input: TaskIdInput,
	) => ClientResult<ListTaskCompletionsSuccessEnvelope>;
	readonly completeTask: (input: {
		readonly taskId: string;
		readonly body: CreateTaskCompletionRequestBody;
	}) => ClientResult<CompleteTaskSuccessEnvelope>;
};

const AgentStreamEventSchema = z.discriminatedUnion("type", [
	z.object({ type: z.literal("text_delta"), delta: z.string() }).strict(),
	z
		.object({
			type: z.literal("final"),
			data: AgentMessageSuccessEnvelopeSchema.shape["data"],
		})
		.strict(),
	z
		.object({
			type: z.literal("error"),
			code: z.enum(["not_found", "agent_model_failed"]),
			message: z.string().min(1),
		})
		.strict(),
]);

const parseAgentStreamResponse = (
	bodyText: string,
): Result<AgentMessageSuccessEnvelope, ApiClientError> => {
	for (const frame of bodyText.split("\n\n")) {
		if (frame.trim().length === 0) continue;
		if (!frame.startsWith("data: ")) {
			return error({
				type: "contract_error",
				message: "Assistant stream response was invalid.",
			});
		}
		let parsed: unknown;
		try {
			parsed = JSON.parse(frame.slice("data: ".length));
		} catch {
			return error({
				type: "contract_error",
				message: "Assistant stream response was invalid.",
			});
		}
		const event = AgentStreamEventSchema.safeParse(parsed);
		if (!event.success) {
			return error({
				type: "contract_error",
				message: "Assistant stream response was invalid.",
			});
		}
		if (event.data.type === "error") {
			return error({
				type: "api_error",
				status: event.data.code === "not_found" ? 404 : 500,
				code: event.data.code,
				message: event.data.message,
			});
		}
		if (event.data.type === "final")
			return { status: "ok", value: { data: event.data.data } };
	}
	return error({
		type: "contract_error",
		message: "Assistant stream ended without a final event.",
	});
};

const execute = async <T>({
	fetch,
	baseUrl,
	auth,
	method,
	path,
	pathParams,
	query,
	body,
	schema,
	operationName,
}: {
	readonly fetch: FetchLike;
	readonly baseUrl: string;
	readonly auth: ApiAuth;
	readonly method: HttpMethod;
	readonly path: string;
	readonly pathParams?: Readonly<Record<string, string>>;
	readonly query?: Readonly<Record<string, string | number | undefined>>;
	readonly body?: unknown;
	readonly schema: z.ZodType<T>;
	readonly operationName: string;
}): Promise<Result<T, ApiClientError>> => {
	const request = buildJsonRequestSpec({
		baseUrl,
		auth,
		method,
		path,
		...(pathParams === undefined ? {} : { pathParams }),
		...(query === undefined ? {} : { query }),
		...(body === undefined ? {} : { body }),
	});
	try {
		const response = await fetch(request.url, {
			method: request.method,
			headers: new Headers(request.headers),
			...(request.bodyText === undefined ? {} : { body: request.bodyText }),
		});
		return parseHttpResponse(
			{ status: response.status, bodyText: await response.text() },
			schema,
			operationName,
		);
	} catch (caught) {
		return error({
			type: "transport_error",
			message:
				caught instanceof Error ? caught.message : "Network request failed.",
		});
	}
};

export const createHomesteadApiClient = ({
	baseUrl,
	auth,
	fetch: injectedFetch = globalThis.fetch.bind(globalThis),
}: HomesteadApiClientConfig): HomesteadApiClient => {
	const normalizedBaseUrl = normalizeApiBaseUrl(baseUrl);
	const multipartRequest = async <T>({
		path,
		pathParams,
		formData,
		schema,
		operationName,
	}: {
		readonly path: string;
		readonly pathParams?: Readonly<Record<string, string>>;
		readonly formData: FormData;
		readonly schema: z.ZodType<T>;
		readonly operationName: string;
	}): Promise<Result<T, ApiClientError>> => {
		if (normalizedBaseUrl.status === "error") return normalizedBaseUrl;
		const requestSpec = buildJsonRequestSpec({
			baseUrl: normalizedBaseUrl.value,
			auth,
			method: "POST",
			path,
			...(pathParams === undefined ? {} : { pathParams }),
		});
		try {
			const response = await injectedFetch(requestSpec.url, {
				method: requestSpec.method,
				headers: new Headers(requestSpec.headers),
				body: formData,
			});
			return parseHttpResponse(
				{ status: response.status, bodyText: await response.text() },
				schema,
				operationName,
			);
		} catch (caught) {
			return error({
				type: "transport_error",
				message:
					caught instanceof Error ? caught.message : "Network request failed.",
			});
		}
	};

	const request = async <T>({
		method,
		path,
		pathParams,
		query,
		body,
		schema,
		operationName,
	}: {
		readonly method: HttpMethod;
		readonly path: string;
		readonly pathParams?: Readonly<Record<string, string>>;
		readonly query?: Readonly<Record<string, string | number | undefined>>;
		readonly body?: unknown;
		readonly schema: z.ZodType<T>;
		readonly operationName: string;
	}): Promise<Result<T, ApiClientError>> => {
		if (normalizedBaseUrl.status === "error") return normalizedBaseUrl;
		return execute({
			fetch: injectedFetch,
			baseUrl: normalizedBaseUrl.value,
			auth,
			method,
			path,
			...(pathParams === undefined ? {} : { pathParams }),
			...(query === undefined ? {} : { query }),
			...(body === undefined ? {} : { body }),
			schema,
			operationName,
		});
	};

	return {
		getHealth: async () =>
			request({
				method: "GET",
				path: "/api/v1/health",
				schema: HealthSuccessEnvelopeSchema,
				operationName: "getHealth",
			}),
		getCurrentPrincipal: async () =>
			request({
				method: "GET",
				path: "/api/v1/auth/me",
				schema: CurrentPrincipalSuccessEnvelopeSchema,
				operationName: "getCurrentPrincipal",
			}),
		registerUser: async (body) =>
			request({
				method: "POST",
				path: "/api/v1/auth/register",
				body,
				schema: RegisterSuccessEnvelopeSchema,
				operationName: "registerUser",
			}),
		revokeCurrentToken: async () =>
			request({
				method: "POST",
				path: "/api/v1/auth/tokens/revoke-current",
				schema: RevokeCurrentTokenSuccessEnvelopeSchema,
				operationName: "revokeCurrentToken",
			}),
		rotateCurrentToken: async () =>
			request({
				method: "POST",
				path: "/api/v1/auth/tokens/rotate-current",
				schema: RotateCurrentTokenSuccessEnvelopeSchema,
				operationName: "rotateCurrentToken",
			}),
		listApiTokens: async () =>
			request({
				method: "GET",
				path: "/api/v1/me/api-tokens",
				schema: ListApiTokensSuccessEnvelopeSchema,
				operationName: "listApiTokens",
			}),
		createApiToken: async (body) =>
			request({
				method: "POST",
				path: "/api/v1/me/api-tokens",
				body,
				schema: CreateApiTokenSuccessEnvelopeSchema,
				operationName: "createApiToken",
			}),
		revokeApiToken: async ({ tokenId }) =>
			request({
				method: "DELETE",
				path: "/api/v1/me/api-tokens/{tokenId}",
				pathParams: { tokenId },
				schema: ApiTokenSuccessEnvelopeSchema,
				operationName: "revokeApiToken",
			}),
		startDeviceLogin: async (body) =>
			request({
				method: "POST",
				path: "/api/v1/device-login/start",
				body,
				schema: DeviceLoginStartSuccessEnvelopeSchema,
				operationName: "startDeviceLogin",
			}),
		getDeviceLoginRequest: async ({ userCode }) =>
			request({
				method: "GET",
				path: "/api/v1/device-login/requests/{userCode}",
				pathParams: { userCode },
				schema: DeviceLoginRequestDetailsSuccessEnvelopeSchema,
				operationName: "getDeviceLoginRequest",
			}),
		approveDeviceLogin: async (body) =>
			request({
				method: "POST",
				path: "/api/v1/device-login/approve",
				body,
				schema: DeviceLoginStatusSuccessEnvelopeSchema,
				operationName: "approveDeviceLogin",
			}),
		denyDeviceLogin: async (body) =>
			request({
				method: "POST",
				path: "/api/v1/device-login/deny",
				body,
				schema: DeviceLoginStatusSuccessEnvelopeSchema,
				operationName: "denyDeviceLogin",
			}),
		pollDeviceLoginToken: async (body) =>
			request({
				method: "POST",
				path: "/api/v1/device-login/token",
				body,
				schema: DeviceLoginTokenSuccessEnvelopeSchema,
				operationName: "pollDeviceLoginToken",
			}),
		postAgentMessage: async (body) =>
			request({
				method: "POST",
				path: "/api/v1/agent/messages",
				body,
				schema: AgentMessageSuccessEnvelopeSchema,
				operationName: "postAgentMessage",
			}),
		postAgentMessageStream: async (body) => {
			if (normalizedBaseUrl.status === "error") return normalizedBaseUrl;
			const requestSpec = buildJsonRequestSpec({
				baseUrl: normalizedBaseUrl.value,
				auth,
				method: "POST",
				path: "/api/v1/agent/messages/stream",
				body,
			});
			try {
				const response = await injectedFetch(requestSpec.url, {
					method: requestSpec.method,
					headers: new Headers(requestSpec.headers),
					...(requestSpec.bodyText === undefined
						? {}
						: { body: requestSpec.bodyText }),
				});
				const bodyText = await response.text();
				if (!response.ok) {
					return error({
						type: "api_error",
						status: response.status,
						message: "Assistant stream request failed.",
					});
				}
				return parseAgentStreamResponse(bodyText);
			} catch (caught) {
				return error({
					type: "transport_error",
					message:
						caught instanceof Error
							? caught.message
							: "Network request failed.",
				});
			}
		},
		approveAgentPlan: async ({ planId }) =>
			request({
				method: "POST",
				path: "/api/v1/agent/plans/{planId}/approve",
				pathParams: { planId },
				schema: AgentPlanApprovalSuccessEnvelopeSchema,
				operationName: "approveAgentPlan",
			}),
		rejectAgentPlan: async ({ planId }) =>
			request({
				method: "POST",
				path: "/api/v1/agent/plans/{planId}/reject",
				pathParams: { planId },
				schema: AgentPlanRejectionSuccessEnvelopeSchema,
				operationName: "rejectAgentPlan",
			}),
		listNotificationIntegrations: async () =>
			request({
				method: "GET",
				path: "/api/v1/me/notification-integrations",
				schema: ListNotificationIntegrationsSuccessEnvelopeSchema,
				operationName: "listNotificationIntegrations",
			}),
		putEmailNotificationIntegration: async (body) =>
			request({
				method: "PUT",
				path: "/api/v1/me/notification-integrations/email",
				body,
				schema: NotificationIntegrationSuccessEnvelopeSchema,
				operationName: "putEmailNotificationIntegration",
			}),
		putTelegramNotificationIntegration: async (body) =>
			request({
				method: "PUT",
				path: "/api/v1/me/notification-integrations/telegram",
				body,
				schema: NotificationIntegrationSuccessEnvelopeSchema,
				operationName: "putTelegramNotificationIntegration",
			}),
		deleteNotificationIntegration: async ({ channel }) =>
			request({
				method: "DELETE",
				path: "/api/v1/me/notification-integrations/{channel}",
				pathParams: { channel },
				schema: z.void(),
				operationName: "deleteNotificationIntegration",
			}),
		listHomes: async () =>
			request({
				method: "GET",
				path: "/api/v1/homes",
				schema: ListHomesSuccessEnvelopeSchema,
				operationName: "listHomes",
			}),
		createHome: async (body) =>
			request({
				method: "POST",
				path: "/api/v1/homes",
				body,
				schema: CreateHomeSuccessEnvelopeSchema,
				operationName: "createHome",
			}),
		listHomeMemberships: async ({ homeId }) =>
			request({
				method: "GET",
				path: "/api/v1/homes/{homeId}/memberships",
				pathParams: { homeId },
				schema: ListHomeMembershipsSuccessEnvelopeSchema,
				operationName: "listHomeMemberships",
			}),
		deleteHomeMembership: async ({ homeId, membershipId }) =>
			request({
				method: "DELETE",
				path: "/api/v1/homes/{homeId}/memberships/{membershipId}",
				pathParams: { homeId, membershipId },
				schema: HomeMembershipSuccessEnvelopeSchema,
				operationName: "deleteHomeMembership",
			}),
		getHomeSummary: async ({ homeId }) =>
			request({
				method: "GET",
				path: "/api/v1/homes/{homeId}/summary",
				pathParams: { homeId },
				schema: HomeSummarySuccessEnvelopeSchema,
				operationName: "getHomeSummary",
			}),
		exportHomeBackup: async ({ homeId }) =>
			request({
				method: "GET",
				path: "/api/v1/homes/{homeId}/backup",
				pathParams: { homeId },
				schema: HomeBackupSuccessEnvelopeSchema,
				operationName: "exportHomeBackup",
			}),
		previewBulkApply: async ({ homeId, body }) =>
			request({
				method: "POST",
				path: "/api/v1/homes/{homeId}/bulk/preview",
				pathParams: { homeId },
				body,
				schema: BulkApplyPreviewSuccessEnvelopeSchema,
				operationName: "previewBulkApply",
			}),
		applyBulk: async ({ homeId, body }) =>
			request({
				method: "POST",
				path: "/api/v1/homes/{homeId}/bulk/apply",
				pathParams: { homeId },
				body,
				schema: BulkApplySuccessEnvelopeSchema,
				operationName: "applyBulk",
			}),
		listReminderDeliveryHistory: async ({ homeId, query }) =>
			request({
				method: "GET",
				path: "/api/v1/homes/{homeId}/reminder-deliveries",
				pathParams: { homeId },
				...(query === undefined ? {} : { query }),
				schema: ListReminderDeliveryHistorySuccessEnvelopeSchema,
				operationName: "listReminderDeliveryHistory",
			}),
		listCuratedTemplates: async (input = {}) =>
			request({
				method: "GET",
				path: "/api/v1/curated-templates",
				...(input.query === undefined ? {} : { query: input.query }),
				schema: ListCuratedTemplatesSuccessEnvelopeSchema,
				operationName: "listCuratedTemplates",
			}),
		getCuratedTemplate: async ({ templateId }) =>
			request({
				method: "GET",
				path: "/api/v1/curated-templates/{templateId}",
				pathParams: { templateId },
				schema: CuratedTemplateSuccessEnvelopeSchema,
				operationName: "getCuratedTemplate",
			}),
		listCuratedTemplateRecommendations: async ({ homeId }) =>
			request({
				method: "GET",
				path: "/api/v1/homes/{homeId}/curated-template-recommendations",
				pathParams: { homeId },
				schema: ListCuratedTemplateRecommendationsSuccessEnvelopeSchema,
				operationName: "listCuratedTemplateRecommendations",
			}),
		instantiateCuratedTemplate: async ({ homeId, templateId, body }) =>
			request({
				method: "POST",
				path: "/api/v1/homes/{homeId}/curated-templates/{templateId}/instantiations",
				pathParams: { homeId, templateId },
				body,
				schema: TemplateInstantiationSuccessEnvelopeSchema,
				operationName: "instantiateCuratedTemplate",
			}),
		listAssets: async ({ homeId, query }) =>
			request({
				method: "GET",
				path: "/api/v1/homes/{homeId}/assets",
				pathParams: { homeId },
				...(query === undefined ? {} : { query }),
				schema: ListAssetsSuccessEnvelopeSchema,
				operationName: "listAssets",
			}),
		createAsset: async ({ homeId, body }) =>
			request({
				method: "POST",
				path: "/api/v1/homes/{homeId}/assets",
				pathParams: { homeId },
				body,
				schema: CreateAssetSuccessEnvelopeSchema,
				operationName: "createAsset",
			}),
		getAsset: async ({ assetId }) =>
			request({
				method: "GET",
				path: "/api/v1/assets/{assetId}",
				pathParams: { assetId },
				schema: AssetSuccessEnvelopeSchema,
				operationName: "getAsset",
			}),
		patchAsset: async ({ assetId, body }) =>
			request({
				method: "PATCH",
				path: "/api/v1/assets/{assetId}",
				pathParams: { assetId },
				body,
				schema: AssetSuccessEnvelopeSchema,
				operationName: "patchAsset",
			}),
		archiveAsset: async ({ assetId }) =>
			request({
				method: "DELETE",
				path: "/api/v1/assets/{assetId}",
				pathParams: { assetId },
				schema: AssetSuccessEnvelopeSchema,
				operationName: "archiveAsset",
			}),
		listAssetFiles: async ({ homeId, query }) =>
			request({
				method: "GET",
				path: "/api/v1/homes/{homeId}/asset-files",
				pathParams: { homeId },
				...(query === undefined ? {} : { query }),
				schema: ListAssetFilesSuccessEnvelopeSchema,
				operationName: "listAssetFiles",
			}),
		uploadAssetFile: async ({ assetId, body }) => {
			const formData = new FormData();
			formData.set("kind", body.kind);
			formData.set("file", body.file, body.fileName);
			return multipartRequest({
				path: "/api/v1/assets/{assetId}/files",
				pathParams: { assetId },
				formData,
				schema: UploadAssetFileSuccessEnvelopeSchema,
				operationName: "uploadAssetFile",
			});
		},
		listTasks: async ({ homeId, query }) =>
			request({
				method: "GET",
				path: "/api/v1/homes/{homeId}/tasks",
				pathParams: { homeId },
				...(query === undefined ? {} : { query }),
				schema: ListTasksSuccessEnvelopeSchema,
				operationName: "listTasks",
			}),
		createTask: async ({ homeId, body }) =>
			request({
				method: "POST",
				path: "/api/v1/homes/{homeId}/tasks",
				pathParams: { homeId },
				body,
				schema: CreateTaskSuccessEnvelopeSchema,
				operationName: "createTask",
			}),
		getTask: async ({ taskId }) =>
			request({
				method: "GET",
				path: "/api/v1/tasks/{taskId}",
				pathParams: { taskId },
				schema: TaskSuccessEnvelopeSchema,
				operationName: "getTask",
			}),
		patchTask: async ({ taskId, body }) =>
			request({
				method: "PATCH",
				path: "/api/v1/tasks/{taskId}",
				pathParams: { taskId },
				body,
				schema: TaskSuccessEnvelopeSchema,
				operationName: "patchTask",
			}),
		archiveTask: async ({ taskId }) =>
			request({
				method: "DELETE",
				path: "/api/v1/tasks/{taskId}",
				pathParams: { taskId },
				schema: TaskSuccessEnvelopeSchema,
				operationName: "archiveTask",
			}),
		getTaskReminderSchedule: async ({ taskId }) =>
			request({
				method: "GET",
				path: "/api/v1/tasks/{taskId}/reminder-schedule",
				pathParams: { taskId },
				schema: TaskReminderScheduleSuccessEnvelopeSchema,
				operationName: "getTaskReminderSchedule",
			}),
		putTaskReminderSchedule: async ({ taskId, body }) =>
			request({
				method: "PUT",
				path: "/api/v1/tasks/{taskId}/reminder-schedule",
				pathParams: { taskId },
				body,
				schema: TaskReminderScheduleSuccessEnvelopeSchema,
				operationName: "putTaskReminderSchedule",
			}),
		deleteTaskReminderSchedule: async ({ taskId }) =>
			request({
				method: "DELETE",
				path: "/api/v1/tasks/{taskId}/reminder-schedule",
				pathParams: { taskId },
				schema: z.void(),
				operationName: "deleteTaskReminderSchedule",
			}),
		listTaskCompletions: async ({ taskId }) =>
			request({
				method: "GET",
				path: "/api/v1/tasks/{taskId}/completions",
				pathParams: { taskId },
				schema: ListTaskCompletionsSuccessEnvelopeSchema,
				operationName: "listTaskCompletions",
			}),
		completeTask: async ({ taskId, body }) =>
			request({
				method: "POST",
				path: "/api/v1/tasks/{taskId}/completions",
				pathParams: { taskId },
				body,
				schema: CompleteTaskSuccessEnvelopeSchema,
				operationName: "completeTask",
			}),
	};
};
