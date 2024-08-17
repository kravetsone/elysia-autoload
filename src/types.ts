import type Elysia from "elysia";
import type { RouteBase } from "elysia";

type PathToObject<
  Path extends string,
  Type extends RouteBase
> = Path extends `${infer Head}/${infer Rest}`
  ? Head extends ""
    ? PathToObject<Rest, Type>
    : { [K in Head]: PathToObject<Rest, Type> }
  : { [K in Path]: Type };

type RouteEndType = Record<
  string,
  {
    body: any;
    params: any;
    query: any;
    headers: any;
    response: any;
  }
>;

type FlattenIndexRoutes<T> = T extends object
  ? {
      [K in keyof T as K extends "index"
        ? T[K] extends RouteEndType
          ? never
          : K
        : K]: FlattenIndexRoutes<T[K]>;
    } & (T extends { index: infer I }
      ? I extends RouteEndType
        ? FlattenIndexRoutes<I>
        : {}
      : {})
  : T;

export type ElysiaWithBaseUrl<
  BaseUrl extends string,
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  ElysiaType extends Elysia<any, any, any, any, any, any, any, any>
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
      FlattenIndexRoutes<PathToObject<BaseUrl, Routes>>,
      Ephemeral,
      Volatile
    >
  : never;

export type SoftString<T extends string> = T | (string & {});
