import type { ApiAuth } from "./config.js";

type HeaderOptions = {
	readonly auth: ApiAuth;
	readonly includeBody: boolean;
};

export const buildJsonHeaders = ({
	auth,
	includeBody,
}: HeaderOptions): Record<string, string> => ({
	Accept: "application/json",
	...(auth.type === "bearer" ? { Authorization: `Bearer ${auth.token}` } : {}),
	...(includeBody ? { "Content-Type": "application/json" } : {}),
});
