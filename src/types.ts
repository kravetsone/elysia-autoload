import type Elysia from "elysia";
import type { RouteBase } from "elysia";

type RemoveLastChar<T extends string> = T extends `${infer V}/` ? V : T;

type RoutesWithPrefix<Routes extends RouteBase, Prefix extends string> = {
	[K in keyof Routes as `${Prefix}${RemoveLastChar<K & string>}`]: Routes[K];
};

export type ElysiaWithBaseUrl<
	BaseUrl extends string,
	ElysiaType,
> = ElysiaType extends Elysia<
	infer BasePath,
	infer Decorators,
	infer Definitions,
	infer ParentSchema,
	infer Macro,
	infer Routes,
	infer Scoped
>
	? Elysia<
			BasePath,
			Decorators,
			Definitions,
			ParentSchema,
			Macro,
			RoutesWithPrefix<Routes, BaseUrl>,
			Scoped
	  >
	: never;
