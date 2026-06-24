import type {
	AssetSuccessEnvelope,
	BulkApplyPreviewSuccessEnvelope,
	BulkApplySuccessEnvelope,
	CompleteTaskSuccessEnvelope,
	CreateAssetSuccessEnvelope,
	CreateTaskSuccessEnvelope,
	CurrentPrincipalSuccessEnvelope,
	CuratedTemplateSuccessEnvelope,
	HealthSuccessEnvelope,
	HomeBackupSuccessEnvelope,
	HomeSummarySuccessEnvelope,
	ListAssetsSuccessEnvelope,
	ListCuratedTemplateRecommendationsSuccessEnvelope,
	ListCuratedTemplatesSuccessEnvelope,
	ListHomeMembershipsSuccessEnvelope,
	ListHomesSuccessEnvelope,
	ListNotificationIntegrationsSuccessEnvelope,
	ListReminderDeliveryHistorySuccessEnvelope,
	NotificationIntegrationSuccessEnvelope,
	ListTaskCompletionsSuccessEnvelope,
	ListTasksSuccessEnvelope,
	RegisterSuccessEnvelope,
	RevokeCurrentTokenSuccessEnvelope,
	RotateCurrentTokenSuccessEnvelope,
	TaskReminderScheduleSuccessEnvelope,
	TaskSuccessEnvelope,
	TemplateInstantiationSuccessEnvelope,
} from "@homestead/sdk";

export type ApiResult =
	| {
			readonly kind: "skill_list";
			readonly data: {
				readonly items: readonly {
					readonly name: string;
					readonly filename: string;
				}[];
			};
	  }
	| {
			readonly kind: "skill";
			readonly data: {
				readonly name: string;
				readonly filename: string;
				readonly content: string;
			};
	  }
	| {
			readonly kind: "health";
			readonly status: HealthSuccessEnvelope["data"]["status"];
	  }
	| {
			readonly kind: "register";
			readonly data: RegisterSuccessEnvelope["data"];
	  }
	| {
			readonly kind: "revoke_token";
			readonly data: RevokeCurrentTokenSuccessEnvelope["data"];
	  }
	| {
			readonly kind: "rotate_token";
			readonly data: RotateCurrentTokenSuccessEnvelope["data"];
	  }
	| {
			readonly kind: "login" | "me";
			readonly data: CurrentPrincipalSuccessEnvelope["data"];
	  }
	| { readonly kind: "homes"; readonly data: ListHomesSuccessEnvelope["data"] }
	| {
			readonly kind: "memberships";
			readonly data: ListHomeMembershipsSuccessEnvelope["data"];
	  }
	| {
			readonly kind: "summary";
			readonly data: HomeSummarySuccessEnvelope["data"];
	  }
	| {
			readonly kind: "backup_export";
			readonly data: HomeBackupSuccessEnvelope["data"];
	  }
	| {
			readonly kind: "bulk_preview";
			readonly data: BulkApplyPreviewSuccessEnvelope["data"];
	  }
	| {
			readonly kind: "bulk_apply";
			readonly data: BulkApplySuccessEnvelope["data"];
	  }
	| {
			readonly kind: "notification_integrations";
			readonly data: ListNotificationIntegrationsSuccessEnvelope["data"];
	  }
	| {
			readonly kind: "set_email_notification";
			readonly data: NotificationIntegrationSuccessEnvelope["data"];
	  }
	| {
			readonly kind: "delete_notification_integration";
			readonly data: { readonly channel: "email" | "telegram" };
	  }
	| {
			readonly kind: "task_reminder_schedule" | "set_task_reminder_schedule";
			readonly data: TaskReminderScheduleSuccessEnvelope["data"];
	  }
	| {
			readonly kind: "delete_task_reminder_schedule";
			readonly data: { readonly taskId: string };
	  }
	| {
			readonly kind: "reminder_deliveries";
			readonly data: ListReminderDeliveryHistorySuccessEnvelope["data"];
	  }
	| {
			readonly kind: "templates";
			readonly data: ListCuratedTemplatesSuccessEnvelope["data"];
	  }
	| {
			readonly kind: "template";
			readonly data: CuratedTemplateSuccessEnvelope["data"];
	  }
	| {
			readonly kind: "recommendations";
			readonly data: ListCuratedTemplateRecommendationsSuccessEnvelope["data"];
	  }
	| {
			readonly kind: "instantiate_template";
			readonly data: TemplateInstantiationSuccessEnvelope["data"];
	  }
	| {
			readonly kind: "complete_task";
			readonly data: CompleteTaskSuccessEnvelope["data"];
	  }
	| {
			readonly kind: "task_completions";
			readonly data: ListTaskCompletionsSuccessEnvelope["data"];
	  }
	| {
			readonly kind: "assets";
			readonly data: ListAssetsSuccessEnvelope["data"];
	  }
	| {
			readonly kind: "create_asset";
			readonly data: CreateAssetSuccessEnvelope["data"];
	  }
	| {
			readonly kind: "asset" | "update_asset" | "archive_asset";
			readonly data: AssetSuccessEnvelope["data"];
	  }
	| { readonly kind: "tasks"; readonly data: ListTasksSuccessEnvelope["data"] }
	| {
			readonly kind: "create_task";
			readonly data: CreateTaskSuccessEnvelope["data"];
	  }
	| {
			readonly kind: "task" | "update_task" | "archive_task";
			readonly data: TaskSuccessEnvelope["data"];
	  };
