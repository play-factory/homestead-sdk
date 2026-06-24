export type Result<T, E> =
	| { readonly status: "ok"; readonly value: T }
	| { readonly status: "error"; readonly error: E };

export const ok = <T, E = never>(value: T): Result<T, E> => ({
	status: "ok",
	value,
});

export const error = <E, T = never>(value: E): Result<T, E> => ({
	status: "error",
	error: value,
});
