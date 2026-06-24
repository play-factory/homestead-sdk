export type CliError =
	| { readonly type: "usage_error"; readonly message: string }
	| { readonly type: "config_error"; readonly message: string }
	| {
			readonly type: "authentication_config_error";
			readonly message: string;
	  }
	| {
			readonly type: "network_error";
			readonly message: string;
			readonly command: string;
			readonly apiBaseUrl: string;
			readonly apiBaseUrlSource: "flag" | "env" | "stored_config" | "default";
			readonly apiBaseUrlSourceLabel: string;
			readonly failureKind:
				| "connection_refused"
				| "dns_failure"
				| "timeout"
				| "tls_failure"
				| "fetch_failed"
				| "unknown";
			readonly causeMessage: string;
			readonly suggestions: readonly string[];
	  }
	| {
			readonly type: "api_error";
			readonly status: number;
			readonly message: string;
			readonly requestId?: string;
	  }
	| { readonly type: "contract_error"; readonly message: string };

export type CliErrorCode =
	| "usage_error"
	| "config_error"
	| "auth_required"
	| "network_error"
	| "api_error"
	| "contract_error";

export const errorCodeForError = (error: CliError): CliErrorCode => {
	switch (error.type) {
		case "usage_error":
			return "usage_error";
		case "config_error":
			return "config_error";
		case "authentication_config_error":
			return "auth_required";
		case "network_error":
			return "network_error";
		case "api_error":
			return "api_error";
		case "contract_error":
			return "contract_error";
	}
};

export const exitCodeForError = (error: CliError): 1 | 2 | 3 => {
	switch (error.type) {
		case "usage_error":
		case "config_error":
			return 2;
		case "authentication_config_error":
			return 3;
		case "network_error":
		case "api_error":
		case "contract_error":
			return 1;
	}
};
