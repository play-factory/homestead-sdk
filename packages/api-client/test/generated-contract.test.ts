import { describe, expect, expectTypeOf, it } from "vitest";

import type { components, paths } from "../src/index.js";

type JsonResponse<Operation, Status extends number> = Operation extends {
	responses: Record<Status, { content: { "application/json": infer Body } }>;
}
	? Body
	: never;

describe("generated OpenAPI types", () => {
	it("include SDK operation paths, bodies, and success envelopes", () => {
		expect.hasAssertions();
		expect(true).toBe(true);

		expectTypeOf<
			JsonResponse<paths["/api/v1/health"]["get"], 200>
		>().toEqualTypeOf<components["schemas"]["HealthSuccessEnvelope"]>();
		expectTypeOf<
			JsonResponse<paths["/api/v1/auth/me"]["get"], 200>
		>().toEqualTypeOf<
			components["schemas"]["CurrentPrincipalSuccessEnvelope"]
		>();
		expectTypeOf<
			JsonResponse<paths["/api/v1/auth/register"]["post"], 201>
		>().toEqualTypeOf<components["schemas"]["RegisterSuccessEnvelope"]>();
		expectTypeOf<
			paths["/api/v1/auth/register"]["post"]["requestBody"]["content"]["application/json"]
		>().toEqualTypeOf<components["schemas"]["RegisterRequestBody"]>();
		expectTypeOf<
			JsonResponse<paths["/api/v1/auth/tokens/revoke-current"]["post"], 200>
		>().toEqualTypeOf<
			components["schemas"]["RevokeCurrentTokenSuccessEnvelope"]
		>();
		expectTypeOf<
			JsonResponse<paths["/api/v1/auth/tokens/rotate-current"]["post"], 200>
		>().toEqualTypeOf<
			components["schemas"]["RotateCurrentTokenSuccessEnvelope"]
		>();
		expectTypeOf<
			JsonResponse<paths["/api/v1/device-login/start"]["post"], 200>
		>().toEqualTypeOf<
			components["schemas"]["DeviceLoginStartSuccessEnvelope"]
		>();
		expectTypeOf<
			paths["/api/v1/device-login/start"]["post"]["requestBody"]["content"]["application/json"]
		>().toEqualTypeOf<components["schemas"]["DeviceLoginStartRequestBody"]>();
		expectTypeOf<
			JsonResponse<
				paths["/api/v1/device-login/requests/{userCode}"]["get"],
				200
			>
		>().toEqualTypeOf<
			components["schemas"]["DeviceLoginRequestDetailsSuccessEnvelope"]
		>();
		expectTypeOf<
			JsonResponse<paths["/api/v1/device-login/approve"]["post"], 200>
		>().toEqualTypeOf<
			components["schemas"]["DeviceLoginStatusSuccessEnvelope"]
		>();
		expectTypeOf<
			paths["/api/v1/device-login/approve"]["post"]["requestBody"]["content"]["application/json"]
		>().toEqualTypeOf<components["schemas"]["DeviceLoginApproveRequestBody"]>();
		expectTypeOf<
			JsonResponse<paths["/api/v1/device-login/deny"]["post"], 200>
		>().toEqualTypeOf<
			components["schemas"]["DeviceLoginStatusSuccessEnvelope"]
		>();
		expectTypeOf<
			paths["/api/v1/device-login/deny"]["post"]["requestBody"]["content"]["application/json"]
		>().toEqualTypeOf<components["schemas"]["DeviceLoginDenyRequestBody"]>();
		expectTypeOf<
			JsonResponse<paths["/api/v1/device-login/token"]["post"], 200>
		>().toEqualTypeOf<
			components["schemas"]["DeviceLoginTokenSuccessEnvelope"]
		>();
		expectTypeOf<
			paths["/api/v1/device-login/token"]["post"]["requestBody"]["content"]["application/json"]
		>().toEqualTypeOf<components["schemas"]["DeviceLoginTokenRequestBody"]>();
		expectTypeOf<
			JsonResponse<paths["/api/v1/homes"]["get"], 200>
		>().toEqualTypeOf<components["schemas"]["ListHomesSuccessEnvelope"]>();
		expectTypeOf<
			JsonResponse<paths["/api/v1/homes/{homeId}/memberships"]["get"], 200>
		>().toEqualTypeOf<
			components["schemas"]["ListHomeMembershipsSuccessEnvelope"]
		>();
		expectTypeOf<
			JsonResponse<paths["/api/v1/homes/{homeId}/summary"]["get"], 200>
		>().toEqualTypeOf<components["schemas"]["HomeSummarySuccessEnvelope"]>();
		expectTypeOf<
			JsonResponse<paths["/api/v1/homes/{homeId}/backup"]["get"], 200>
		>().toEqualTypeOf<components["schemas"]["HomeBackupSuccessEnvelope"]>();
		expectTypeOf<
			JsonResponse<paths["/api/v1/homes/{homeId}/bulk/preview"]["post"], 200>
		>().toEqualTypeOf<
			components["schemas"]["BulkApplyPreviewSuccessEnvelope"]
		>();
		expectTypeOf<
			paths["/api/v1/homes/{homeId}/bulk/preview"]["post"]["requestBody"]["content"]["application/json"]
		>().toEqualTypeOf<components["schemas"]["BulkApplyRequestBody"]>();
		expectTypeOf<
			JsonResponse<paths["/api/v1/homes/{homeId}/bulk/apply"]["post"], 201>
		>().toEqualTypeOf<components["schemas"]["BulkApplySuccessEnvelope"]>();
		expectTypeOf<
			paths["/api/v1/homes/{homeId}/bulk/apply"]["post"]["requestBody"]["content"]["application/json"]
		>().toEqualTypeOf<components["schemas"]["BulkApplyRequestBody"]>();
		expectTypeOf<
			JsonResponse<paths["/api/v1/curated-templates"]["get"], 200>
		>().toEqualTypeOf<
			components["schemas"]["ListCuratedTemplatesSuccessEnvelope"]
		>();
		expectTypeOf<
			JsonResponse<paths["/api/v1/curated-templates/{templateId}"]["get"], 200>
		>().toEqualTypeOf<
			components["schemas"]["CuratedTemplateSuccessEnvelope"]
		>();
		expectTypeOf<
			JsonResponse<
				paths["/api/v1/homes/{homeId}/curated-template-recommendations"]["get"],
				200
			>
		>().toEqualTypeOf<
			components["schemas"]["ListCuratedTemplateRecommendationsSuccessEnvelope"]
		>();
		expectTypeOf<
			JsonResponse<
				paths["/api/v1/homes/{homeId}/curated-templates/{templateId}/instantiations"]["post"],
				201
			>
		>().toEqualTypeOf<
			components["schemas"]["TemplateInstantiationSuccessEnvelope"]
		>();
		expectTypeOf<
			paths["/api/v1/homes/{homeId}/curated-templates/{templateId}/instantiations"]["post"]["requestBody"]["content"]["application/json"]
		>().toEqualTypeOf<
			components["schemas"]["InstantiateTemplateRequestBody"]
		>();
		expectTypeOf<
			JsonResponse<paths["/api/v1/homes/{homeId}/assets"]["get"], 200>
		>().toEqualTypeOf<components["schemas"]["ListAssetsSuccessEnvelope"]>();
		expectTypeOf<
			JsonResponse<paths["/api/v1/homes/{homeId}/assets"]["post"], 201>
		>().toEqualTypeOf<components["schemas"]["CreateAssetSuccessEnvelope"]>();
		expectTypeOf<
			paths["/api/v1/homes/{homeId}/assets"]["post"]["requestBody"]["content"]["application/json"]
		>().toEqualTypeOf<components["schemas"]["CreateAssetRequestBody"]>();
		expectTypeOf<
			JsonResponse<paths["/api/v1/assets/{assetId}"]["get"], 200>
		>().toEqualTypeOf<components["schemas"]["AssetSuccessEnvelope"]>();
		expectTypeOf<
			JsonResponse<paths["/api/v1/assets/{assetId}"]["patch"], 200>
		>().toEqualTypeOf<components["schemas"]["AssetSuccessEnvelope"]>();
		expectTypeOf<
			JsonResponse<paths["/api/v1/assets/{assetId}"]["delete"], 200>
		>().toEqualTypeOf<components["schemas"]["AssetSuccessEnvelope"]>();
		expectTypeOf<
			JsonResponse<paths["/api/v1/homes/{homeId}/tasks"]["get"], 200>
		>().toEqualTypeOf<components["schemas"]["ListTasksSuccessEnvelope"]>();
		expectTypeOf<
			JsonResponse<paths["/api/v1/homes/{homeId}/tasks"]["post"], 201>
		>().toEqualTypeOf<components["schemas"]["CreateTaskSuccessEnvelope"]>();
		expectTypeOf<
			paths["/api/v1/homes/{homeId}/tasks"]["post"]["requestBody"]["content"]["application/json"]
		>().toEqualTypeOf<components["schemas"]["CreateTaskRequestBody"]>();
		expectTypeOf<
			JsonResponse<paths["/api/v1/tasks/{taskId}"]["get"], 200>
		>().toEqualTypeOf<components["schemas"]["TaskSuccessEnvelope"]>();
		expectTypeOf<
			JsonResponse<paths["/api/v1/tasks/{taskId}"]["patch"], 200>
		>().toEqualTypeOf<components["schemas"]["TaskSuccessEnvelope"]>();
		expectTypeOf<
			JsonResponse<paths["/api/v1/tasks/{taskId}"]["delete"], 200>
		>().toEqualTypeOf<components["schemas"]["TaskSuccessEnvelope"]>();
		expectTypeOf<
			JsonResponse<paths["/api/v1/tasks/{taskId}/completions"]["get"], 200>
		>().toEqualTypeOf<
			components["schemas"]["ListTaskCompletionsSuccessEnvelope"]
		>();
		expectTypeOf<
			JsonResponse<paths["/api/v1/tasks/{taskId}/completions"]["post"], 201>
		>().toEqualTypeOf<components["schemas"]["CompleteTaskSuccessEnvelope"]>();
		expectTypeOf<
			paths["/api/v1/tasks/{taskId}/completions"]["post"]["requestBody"]["content"]["application/json"]
		>().toEqualTypeOf<
			components["schemas"]["CreateTaskCompletionRequestBody"]
		>();
	});
});
