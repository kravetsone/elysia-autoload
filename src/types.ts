import type Elysia from "elysia";
import type { RouteBase } from "elysia";

type RemoveLastChar<T extends string> = T extends `${infer V}/` ? V : T;

type RoutesWithPrefix<Routes extends RouteBase, Prefix extends string> = {
	[K in keyof Routes as `${Prefix}${RemoveLastChar<K & string>}`]: Routes[K];
};

export type ElysiaWithBaseUrl<
	BaseUrl extends string,
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	ElysiaType extends Elysia<any, any, any, any, any, any, any, any>,
> = ElysiaType extends Elysia<
	infer BasePath,
	infer Scoped,
	infer Singleton,
	infer Definitions,
	infer Metadata,
	infer Routes,
	infer Ephemeral,
	infer Volatile
>
	? Elysia<
			BasePath,
			Scoped,
			Singleton,
			Definitions,
			Metadata,
			RoutesWithPrefix<Routes, BaseUrl>,
			Ephemeral,
			Volatile
	  >
	: never;
