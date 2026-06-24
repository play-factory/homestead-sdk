import type { BulkApplyRequestBody } from "@homestead/sdk";

export type JsonObject = Readonly<Record<string, unknown>>;
export type CliTaskRecurrence = {
	readonly frequency: "daily" | "weekly" | "monthly" | "yearly";
	readonly interval: number;
};

export type CliCommand =
	| { readonly kind: "health" }
	| { readonly kind: "login"; readonly tokenFromStdin: boolean }
	| {
			readonly kind: "register";
			readonly name: string;
			readonly email?: string;
			readonly setupToken?: string;
			readonly setupTokenFromStdin: boolean;
	  }
	| { readonly kind: "revoke_token" }
	| { readonly kind: "rotate_token" }
	| { readonly kind: "me" }
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
			readonly emailAddress: string;
			readonly status: "enabled" | "disabled";
			readonly deliveryMode: "digest" | "individual";
	  }
	| {
			readonly kind: "delete_notification_integration";
			readonly channel: "email" | "telegram";
	  }
	| {
			readonly kind: "task_reminder_schedule";
			readonly taskId: string;
	  }
	| {
			readonly kind: "set_task_reminder_schedule";
			readonly taskId: string;
			readonly channels: readonly ("email" | "telegram")[];
			readonly rules: readonly {
				readonly frequency: "daily" | "weekly";
				readonly startsBeforeDueDays: number;
				readonly endsBeforeDueDays: number;
			}[];
	  }
	| { readonly kind: "delete_task_reminder_schedule"; readonly taskId: string }
	| {
			readonly kind: "reminder_deliveries";
			readonly homeId: string;
			readonly status?: "pending" | "sending" | "sent" | "skipped" | "failed";
			readonly channel?: "email" | "telegram";
			readonly taskId?: string;
			readonly limit?: number;
	  }
	| {
			readonly kind: "templates";
			readonly templateKind?: "asset" | "task";
			readonly category?: string;
	  }
	| { readonly kind: "template"; readonly templateId: string }
	| { readonly kind: "recommendations"; readonly homeId: string }
	| {
			readonly kind: "instantiate_template";
			readonly homeId: string;
			readonly templateId: string;
			readonly assetId?: string;
			readonly dueAt?: string;
	  }
	| {
			readonly kind: "complete_task";
			readonly taskId: string;
			readonly notes?: string;
	  }
	| {
			readonly kind: "assets";
			readonly homeId: string;
			readonly assetType?: string;
			readonly status?: "active" | "archived";
	  }
	| {
			readonly kind: "create_asset";
			readonly homeId: string;
			readonly name: string;
			readonly assetType: string;
			readonly parentAssetId?: string;
			readonly notes?: string;
			readonly profile?: JsonObject;
	  }
	| { readonly kind: "asset"; readonly assetId: string }
	| {
			readonly kind: "update_asset";
			readonly assetId: string;
			readonly name?: string;
			readonly assetType?: string;
			readonly parentAssetId?: string | null;
			readonly notes?: string | null;
			readonly profile?: JsonObject;
	  }
	| { readonly kind: "archive_asset"; readonly assetId: string }
	| {
			readonly kind: "tasks";
			readonly homeId: string;
			readonly assetId?: string;
			readonly status?: "open" | "completed" | "archived";
	  }
	| {
			readonly kind: "create_task";
			readonly homeId: string;
			readonly title: string;
			readonly assetId?: string;
			readonly notes?: string;
			readonly dueAt?: string;
			readonly recurrence?: CliTaskRecurrence;
	  }
	| { readonly kind: "task"; readonly taskId: string }
	| {
			readonly kind: "update_task";
			readonly taskId: string;
			readonly title?: string;
			readonly assetId?: string | null;
			readonly notes?: string | null;
			readonly dueAt?: string | null;
			readonly recurrence?: CliTaskRecurrence | null;
			readonly status?: "open" | "completed";
	  }
	| { readonly kind: "task_completions"; readonly taskId: string }
	| { readonly kind: "archive_task"; readonly taskId: string }
	| { readonly kind: "skill_list" }
	| { readonly kind: "skill"; readonly name: string };

export const commandRequiresAuth = (command: CliCommand): boolean =>
	command.kind !== "health" &&
	command.kind !== "login" &&
	command.kind !== "register" &&
	command.kind !== "skill_list" &&
	command.kind !== "skill";
