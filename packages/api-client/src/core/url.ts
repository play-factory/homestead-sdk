type QueryValue = string | number | undefined;

type UrlParameters = {
	readonly path?: Readonly<Record<string, string>>;
	readonly query?: Readonly<Record<string, QueryValue>>;
};

const withPathParams = (
	pathTemplate: string,
	pathParams: Readonly<Record<string, string>>,
): string =>
	Object.entries(pathParams).reduce(
		(path, [key, value]) =>
			path.replaceAll(`{${key}}`, encodeURIComponent(value)),
		pathTemplate,
	);

export const joinApiUrl = (
	baseUrl: string,
	pathTemplate: string,
	parameters: UrlParameters = {},
): string => {
	const path = withPathParams(pathTemplate, parameters.path ?? {});
	const url = new URL(path, `${baseUrl}/`);
	const queryEntries = Object.entries(parameters.query ?? {})
		.filter((entry): entry is [string, string | number] => entry[1] !== undefined)
		.toSorted(([left], [right]) => left.localeCompare(right));
	for (const [key, value] of queryEntries) {
		url.searchParams.set(key, String(value));
	}
	return url.toString();
};
