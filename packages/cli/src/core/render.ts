import type { ApiResult } from "./api-result.js";
import type { CliCommandName } from "./command-metadata.js";
import type { OutputFormat } from "./config.js";
import { errorCodeForError, type CliError } from "./errors.js";

const line = (parts: readonly string[]): string => parts.join("\t");

const sanitizeJsonData = (result: ApiResult): unknown => {
	if (result.kind === "health") return { status: result.status };
	if (result.kind === "register") {
		const { token: _token, ...data } = result.data;
		return data;
	}
	if (result.kind === "rotate_token") {
		return { token: "[redacted]" };
	}
	return result.data;
};

export type CommandHandlerResult<T> = {
	readonly data: T;
	readonly human: string;
};

export const renderSuccess = (
	result: ApiResult,
	format: OutputFormat,
	command: CliCommandName = result.kind as CliCommandName,
): string => {
	if (format === "json") {
		return `${JSON.stringify({ ok: true, command, data: sanitizeJsonData(result) }, null, 2)}\n`;
	}
	switch (result.kind) {
		case "skill_list":
			return result.data.items.length === 0
				? "No skills found.\n"
				: `${line(["NAME", "FILENAME"])}\n${result.data.items.map((skill) => line([skill.name, skill.filename])).join("\n")}\n`;
		case "skill":
			return result.data.content.endsWith("\n")
				? result.data.content
				: `${result.data.content}\n`;
		case "health":
			return "ok\n";
		case "login":
			return `Logged in as ${result.data.user.name} (${result.data.user.email ?? result.data.user.id})\n`;
		case "register":
			return `Registered and logged in as ${result.data.user.name} (${result.data.user.email ?? result.data.user.id})\n`;
		case "revoke_token":
			return `Revoked current token at ${result.data.revokedAt}\n`;
		case "rotate_token":
			return "Rotated current token and updated local login.\n";
		case "me":
			return `${result.data.user.name}\t${result.data.user.email ?? ""}\t${result.data.user.id}\n`;
		case "homes":
			return result.data.items.length === 0
				? "No homes found.\n"
				: `${line(["ID", "NAME", "ROLE"])}\n${result.data.items
						.map((home) => line([home.id, home.name, home.role]))
						.join("\n")}\n`;
		case "memberships":
			return result.data.items.length === 0
				? "No memberships found.\n"
				: `${line(["ID", "HOME_ID", "ROLE", "USER"])}\n${result.data.items
						.map((membership) =>
							line([
								membership.id,
								membership.homeId,
								membership.role,
								membership.user.name,
							]),
						)
						.join("\n")}\n`;
		case "summary":
			return [
				`Home: ${result.data.homeId}`,
				`Assets: ${result.data.counts.assets.active} active, ${result.data.counts.assets.archived} archived, ${result.data.counts.assets.total} total`,
				`Tasks: ${result.data.counts.tasks.open} open, ${result.data.counts.tasks.completed} completed, ${result.data.counts.tasks.archived} archived, ${result.data.counts.tasks.total} total`,
				`Due: ${result.data.counts.due.overdue} overdue, ${result.data.counts.due.dueToday} today, ${result.data.counts.due.dueThisWeek} this week, ${result.data.counts.due.upcoming} upcoming, ${result.data.counts.due.unscheduled} unscheduled`,
				"",
			].join("\n");
		case "backup_export":
			return `${JSON.stringify(result.data, null, 2)}\n`;
		case "bulk_preview":
			return result.data.status === "valid"
				? `Bulk plan is valid: ${result.data.plan.operations.length} operations.\n`
				: `Bulk plan is invalid: ${result.data.errors.length} errors.\n`;
		case "bulk_apply":
			return `Created ${result.data.created.assets.length} assets and ${result.data.created.tasks.length} tasks.\n`;
		case "notification_integrations":
			return result.data.items.length === 0
				? "No notification integrations found.\n"
				: `${line(["CHANNEL", "STATUS"])}\n${result.data.items.map((integration) => line([integration.channel, integration.status])).join("\n")}\n`;
		case "set_email_notification":
			return `Saved email notification integration: ${result.data.integration.status}\n`;
		case "delete_notification_integration":
			return `Deleted ${result.data.channel} notification integration.\n`;
		case "task_reminder_schedule":
		case "set_task_reminder_schedule":
			return result.data.schedule === null
				? "No task reminder schedule found.\n"
				: `${line(["TASK_ID", "CHANNELS", "RULES"])}\n${line([
						result.data.schedule.taskId,
						result.data.schedule.channels.join(","),
						result.data.schedule.rules
							.map(
								(rule) =>
									`${rule.frequency}:${rule.startsBeforeDueDays}:${rule.endsBeforeDueDays}`,
							)
							.join(","),
					])}\n`;
		case "delete_task_reminder_schedule":
			return `Deleted reminder schedule for task ${result.data.taskId}.\n`;
		case "reminder_deliveries":
			return result.data.items.length === 0
				? "No reminder deliveries found.\n"
				: `${line(["ID", "TASK", "CHANNEL", "STATUS", "SCHEDULED_FOR", "ATTEMPTS"])}\n${result.data.items.map((delivery) => line([delivery.id, delivery.taskTitle, delivery.channel, delivery.status, delivery.scheduledFor, String(delivery.attemptCount)])).join("\n")}\n`;
		case "templates":
			return result.data.items.length === 0
				? "No templates found.\n"
				: `${line(["ID", "KIND", "CATEGORY", "TITLE"])}\n${result.data.items
						.map((template) =>
							line([
								template.id,
								template.kind,
								template.category,
								template.title,
							]),
						)
						.join("\n")}\n`;
		case "template":
			return `${line(["ID", "KIND", "CATEGORY", "TITLE"])}\n${line([result.data.template.id, result.data.template.kind, result.data.template.category, result.data.template.title])}\n`;
		case "recommendations":
			return result.data.items.length === 0
				? "No recommendations found.\n"
				: `${line(["TEMPLATE", "KIND", "CATEGORY", "REASON"])}\n${result.data.items
						.map((item) =>
							line([
								item.template.id,
								item.template.kind,
								item.template.category,
								item.reason.type,
							]),
						)
						.join("\n")}\n`;
		case "instantiate_template":
			return result.data.kind === "asset"
				? `Created asset ${result.data.asset.name} (${result.data.asset.id})\n`
				: `Created task ${result.data.task.title} (${result.data.task.id})\n`;
		case "complete_task":
			return `Completed task ${result.data.task.title} (${result.data.task.id})\n`;
		case "assets":
			return result.data.items.length === 0
				? "No assets found.\n"
				: `${line(["ID", "NAME", "TYPE", "PARENT_ASSET_ID", "ARCHIVED_AT"])}\n${result.data.items
						.map((asset) =>
							line([
								asset.id,
								asset.name,
								asset.type,
								asset.parentAssetId ?? "",
								asset.archivedAt ?? "",
							]),
						)
						.join("\n")}\n`;
		case "create_asset":
			return `Created asset ${result.data.asset.name} (${result.data.asset.id})\n`;
		case "asset":
			return `${line(["ID", "NAME", "TYPE", "PARENT_ASSET_ID", "ARCHIVED_AT"])}\n${line([result.data.asset.id, result.data.asset.name, result.data.asset.type, result.data.asset.parentAssetId ?? "", result.data.asset.archivedAt ?? ""])}\n`;
		case "update_asset":
			return `Updated asset ${result.data.asset.name} (${result.data.asset.id})\n`;
		case "archive_asset":
			return `Archived asset ${result.data.asset.name} (${result.data.asset.id})\n`;
		case "tasks":
			return result.data.items.length === 0
				? "No tasks found.\n"
				: `${line(["ID", "TITLE", "STATUS", "DUE_AT", "ASSET_ID", "ARCHIVED_AT"])}\n${result.data.items
						.map((task) =>
							line([
								task.id,
								task.title,
								task.status,
								task.dueAt ?? "",
								task.assetId ?? "",
								task.archivedAt ?? "",
							]),
						)
						.join("\n")}\n`;
		case "create_task":
			return `Created task ${result.data.task.title} (${result.data.task.id})\n`;
		case "task":
			return `${line(["ID", "TITLE", "STATUS", "DUE_AT", "ASSET_ID", "ARCHIVED_AT"])}\n${line([result.data.task.id, result.data.task.title, result.data.task.status, result.data.task.dueAt ?? "", result.data.task.assetId ?? "", result.data.task.archivedAt ?? ""])}\n`;
		case "update_task":
			return `Updated task ${result.data.task.title} (${result.data.task.id})\n`;
		case "task_completions":
			return result.data.items.length === 0
				? "No task completions found.\n"
				: `${line(["ID", "COMPLETED_AT", "NOTES"])}\n${result.data.items.map((completion) => line([completion.id, completion.completedAt, completion.notes ?? ""])).join("\n")}\n`;
		case "archive_task":
			return `Archived task ${result.data.task.title} (${result.data.task.id})\n`;
	}
};

const renderNetworkError = (
	error: Extract<CliError, { readonly type: "network_error" }>,
): string =>
	[
		error.message,
		`API base URL: ${error.apiBaseUrl}`,
		`Base URL source: ${error.apiBaseUrlSourceLabel}`,
		`Cause: ${error.causeMessage}`,
		"",
		"Try:",
		...error.suggestions.map((suggestion) => `- ${suggestion}`),
		"",
	].join("\n");

const errorDetails = (error: CliError): Readonly<Record<string, unknown>> => {
	switch (error.type) {
		case "api_error":
			return {
				status: error.status,
				...(error.requestId === undefined
					? {}
					: { requestId: error.requestId }),
			};
		case "network_error":
			return {
				apiBaseUrl: error.apiBaseUrl,
				apiBaseUrlSource: error.apiBaseUrlSource,
				failureKind: error.failureKind,
				cause: error.causeMessage,
				suggestions: error.suggestions,
			};
		case "usage_error":
		case "config_error":
		case "authentication_config_error":
		case "contract_error":
			return {};
	}
};

export const renderError = (
	error: CliError,
	format: OutputFormat = "table",
	command: CliCommandName | null = null,
): string => {
	if (format === "json") {
		return `${JSON.stringify({ ok: false, command, error: { code: errorCodeForError(error), message: error.message, details: errorDetails(error) } }, null, 2)}\n`;
	}
	switch (error.type) {
		case "api_error":
			return error.requestId === undefined
				? `API error (${error.status}): ${error.message}\n`
				: `API error (${error.status}): ${error.message} [requestId: ${error.requestId}]\n`;
		case "usage_error":
		case "config_error":
		case "authentication_config_error":
		case "contract_error":
			return `${error.message}\n`;
		case "network_error":
			return renderNetworkError(error);
	}
};
