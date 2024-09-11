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

namespace ElysiaMatch {
  export type RouteEnd = Record<
    string,
    {
      body: any;
      params: any;
      query: any;
      headers: any;
      response: any;
    }
  >;

  export type Any = Elysia<any, any, any, any, any, any, any, any>;
  export type Fx = (...args: any[]) => Any;
  export type All = Any | Fx;

  export type Extract<T extends All> = T extends Fx ? ReturnType<T> : T;
}

type FlattenIndexRoutes<T> = T extends object
  ? {
      [K in keyof T as K extends "index"
        ? T[K] extends ElysiaMatch.RouteEnd
          ? never
          : K
        : K]: FlattenIndexRoutes<T[K]>;
    } & (T extends { index: infer I }
      ? I extends ElysiaMatch.RouteEnd
        ? FlattenIndexRoutes<I>
        : T
      : T)
  : T;

export type ElysiaWithBaseUrl<
  BaseUrl extends string,
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  ElysiaType extends ElysiaMatch.All
> = ElysiaMatch.Extract<ElysiaType> extends Elysia<
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
