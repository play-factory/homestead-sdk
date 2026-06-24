import {
	createHomesteadApiClient,
	type ApiClientError,
	type FetchLike,
	type HomesteadApiClientConfig,
} from "@homestead/sdk";

import type { CliApiOperation } from "../core/api-client-command.js";
import { mapApiClientError } from "../core/api-client-error.js";
import type { ApiResult } from "../core/api-result.js";
import type { CliConfig } from "../core/config.js";
import type { CliError } from "../core/errors.js";
import { error, ok, type Result } from "../core/result.js";

const authForOperation = (
	operation: CliApiOperation,
	config: CliConfig,
): HomesteadApiClientConfig["auth"] =>
	operation.kind === "health" ||
	operation.kind === "register" ||
	config.token === null
		? { type: "anonymous" }
		: { type: "bearer", token: config.token };

const mapResult = async <T>(
	promise: Promise<Result<T, ApiClientError>>,
	mapSuccess: (value: T) => ApiResult,
	secrets: readonly (string | null | undefined)[],
	operation: CliApiOperation,
	config: CliConfig,
): Promise<Result<ApiResult, CliError>> => {
	const result = await promise;
	return result.status === "ok"
		? ok(mapSuccess(result.value))
		: error(
				mapApiClientError(result.error, secrets, {
					command: operation.kind,
					config,
				}),
			);
};

export const executeCliApiOperation = async ({
	operation,
	config,
	fetch,
	secrets,
}: {
	readonly operation: CliApiOperation;
	readonly config: CliConfig;
	readonly fetch?: FetchLike;
	readonly secrets: readonly (string | null | undefined)[];
}): Promise<Result<ApiResult, CliError>> => {
	const client = createHomesteadApiClient({
		baseUrl: config.apiBaseUrl,
		auth: authForOperation(operation, config),
		...(fetch === undefined ? {} : { fetch }),
	});
	switch (operation.kind) {
		case "health":
			return mapResult(
				client.getHealth(),
				(value) => ({ kind: "health", status: value.data.status }),
				secrets,
				operation,
				config,
			);
		case "login":
			return mapResult(
				client.getCurrentPrincipal(),
				(value) => ({ kind: "login", data: value.data }),
				secrets,
				operation,
				config,
			);
		case "me":
			return mapResult(
				client.getCurrentPrincipal(),
				(value) => ({ kind: "me", data: value.data }),
				secrets,
				operation,
				config,
			);
		case "register":
			return mapResult(
				client.registerUser(operation.body),
				(value) => ({ kind: "register", data: value.data }),
				secrets,
				operation,
				config,
			);
		case "revoke_token":
			return mapResult(
				client.revokeCurrentToken(),
				(value) => ({ kind: "revoke_token", data: value.data }),
				secrets,
				operation,
				config,
			);
		case "rotate_token":
			return mapResult(
				client.rotateCurrentToken(),
				(value) => ({ kind: "rotate_token", data: value.data }),
				secrets,
				operation,
				config,
			);
		case "homes":
			return mapResult(
				client.listHomes(),
				(value) => ({ kind: "homes", data: value.data }),
				secrets,
				operation,
				config,
			);
		case "memberships":
			return mapResult(
				client.listHomeMemberships({ homeId: operation.homeId }),
				(value) => ({ kind: "memberships", data: value.data }),
				secrets,
				operation,
				config,
			);
		case "summary":
			return mapResult(
				client.getHomeSummary({ homeId: operation.homeId }),
				(value) => ({ kind: "summary", data: value.data }),
				secrets,
				operation,
				config,
			);
		case "backup_export":
			return mapResult(
				client.exportHomeBackup({ homeId: operation.homeId }),
				(value) => ({ kind: "backup_export", data: value.data }),
				secrets,
				operation,
				config,
			);
		case "bulk_preview":
			return mapResult(
				client.previewBulkApply({
					homeId: operation.homeId,
					body: operation.body,
				}),
				(value) => ({ kind: "bulk_preview", data: value.data }),
				secrets,
				operation,
				config,
			);
		case "bulk_apply":
			return mapResult(
				client.applyBulk({ homeId: operation.homeId, body: operation.body }),
				(value) => ({ kind: "bulk_apply", data: value.data }),
				secrets,
				operation,
				config,
			);
		case "notification_integrations":
			return mapResult(
				client.listNotificationIntegrations(),
				(value) => ({ kind: "notification_integrations", data: value.data }),
				secrets,
				operation,
				config,
			);
		case "set_email_notification":
			return mapResult(
				client.putEmailNotificationIntegration(operation.body),
				(value) => ({ kind: "set_email_notification", data: value.data }),
				secrets,
				operation,
				config,
			);
		case "delete_notification_integration":
			return mapResult(
				client.deleteNotificationIntegration({ channel: operation.channel }),
				() => ({
					kind: "delete_notification_integration",
					data: { channel: operation.channel },
				}),
				secrets,
				operation,
				config,
			);
		case "task_reminder_schedule":
			return mapResult(
				client.getTaskReminderSchedule({ taskId: operation.taskId }),
				(value) => ({ kind: "task_reminder_schedule", data: value.data }),
				secrets,
				operation,
				config,
			);
		case "set_task_reminder_schedule":
			return mapResult(
				client.putTaskReminderSchedule({
					taskId: operation.taskId,
					body: operation.body,
				}),
				(value) => ({ kind: "set_task_reminder_schedule", data: value.data }),
				secrets,
				operation,
				config,
			);
		case "delete_task_reminder_schedule":
			return mapResult(
				client.deleteTaskReminderSchedule({ taskId: operation.taskId }),
				() => ({
					kind: "delete_task_reminder_schedule",
					data: { taskId: operation.taskId },
				}),
				secrets,
				operation,
				config,
			);
		case "reminder_deliveries":
			return mapResult(
				client.listReminderDeliveryHistory({
					homeId: operation.homeId,
					...(operation.query === undefined ? {} : { query: operation.query }),
				}),
				(value) => ({ kind: "reminder_deliveries", data: value.data }),
				secrets,
				operation,
				config,
			);
		case "templates":
			return mapResult(
				client.listCuratedTemplates(
					operation.query === undefined ? {} : { query: operation.query },
				),
				(value) => ({ kind: "templates", data: value.data }),
				secrets,
				operation,
				config,
			);
		case "template":
			return mapResult(
				client.getCuratedTemplate({ templateId: operation.templateId }),
				(value) => ({ kind: "template", data: value.data }),
				secrets,
				operation,
				config,
			);
		case "recommendations":
			return mapResult(
				client.listCuratedTemplateRecommendations({ homeId: operation.homeId }),
				(value) => ({ kind: "recommendations", data: value.data }),
				secrets,
				operation,
				config,
			);
		case "instantiate_template":
			return mapResult(
				client.instantiateCuratedTemplate({
					homeId: operation.homeId,
					templateId: operation.templateId,
					body: operation.body,
				}),
				(value) => ({ kind: "instantiate_template", data: value.data }),
				secrets,
				operation,
				config,
			);
		case "complete_task":
			return mapResult(
				client.completeTask({ taskId: operation.taskId, body: operation.body }),
				(value) => ({ kind: "complete_task", data: value.data }),
				secrets,
				operation,
				config,
			);
		case "assets":
			return mapResult(
				client.listAssets({
					homeId: operation.homeId,
					...(operation.query === undefined ? {} : { query: operation.query }),
				}),
				(value) => ({ kind: "assets", data: value.data }),
				secrets,
				operation,
				config,
			);
		case "create_asset":
			return mapResult(
				client.createAsset({ homeId: operation.homeId, body: operation.body }),
				(value) => ({ kind: "create_asset", data: value.data }),
				secrets,
				operation,
				config,
			);
		case "asset":
			return mapResult(
				client.getAsset({ assetId: operation.assetId }),
				(value) => ({ kind: "asset", data: value.data }),
				secrets,
				operation,
				config,
			);
		case "update_asset":
			return mapResult(
				client.patchAsset({ assetId: operation.assetId, body: operation.body }),
				(value) => ({ kind: "update_asset", data: value.data }),
				secrets,
				operation,
				config,
			);
		case "archive_asset":
			return mapResult(
				client.archiveAsset({ assetId: operation.assetId }),
				(value) => ({ kind: "archive_asset", data: value.data }),
				secrets,
				operation,
				config,
			);
		case "tasks":
			return mapResult(
				client.listTasks({
					homeId: operation.homeId,
					...(operation.query === undefined ? {} : { query: operation.query }),
				}),
				(value) => ({ kind: "tasks", data: value.data }),
				secrets,
				operation,
				config,
			);
		case "create_task":
			return mapResult(
				client.createTask({ homeId: operation.homeId, body: operation.body }),
				(value) => ({ kind: "create_task", data: value.data }),
				secrets,
				operation,
				config,
			);
		case "task":
			return mapResult(
				client.getTask({ taskId: operation.taskId }),
				(value) => ({ kind: "task", data: value.data }),
				secrets,
				operation,
				config,
			);
		case "update_task":
			return mapResult(
				client.patchTask({ taskId: operation.taskId, body: operation.body }),
				(value) => ({ kind: "update_task", data: value.data }),
				secrets,
				operation,
				config,
			);
		case "archive_task":
			return mapResult(
				client.archiveTask({ taskId: operation.taskId }),
				(value) => ({ kind: "archive_task", data: value.data }),
				secrets,
				operation,
				config,
			);
		case "task_completions":
			return mapResult(
				client.listTaskCompletions({ taskId: operation.taskId }),
				(value) => ({ kind: "task_completions", data: value.data }),
				secrets,
				operation,
				config,
			);
	}
};
