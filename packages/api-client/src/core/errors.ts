export type ApiClientError =
	| { readonly type: "configuration_error"; readonly message: string }
	| { readonly type: "transport_error"; readonly message: string }
	| {
			readonly type: "api_error";
			readonly status: number;
			readonly code?: string;
			readonly message: string;
			readonly requestId?: string;
	  }
	| { readonly type: "contract_error"; readonly message: string };
