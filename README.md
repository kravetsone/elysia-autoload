# elysia-autoload

<div align="center">

[![npm](https://img.shields.io/npm/v/elysia-autoload?logo=npm&style=flat&labelColor=000&color=3b82f6)](https://www.npmjs.org/package/elysia-autoload)
[![npm downloads](https://img.shields.io/npm/dw/elysia-autoload?logo=npm&style=flat&labelColor=000&color=3b82f6)](https://www.npmjs.org/package/elysia-autoload)

<!-- [![JSR](https://jsr.io/badges/elysia-autoload)](https://jsr.io/elysia-autoload)
[![JSR Score](https://jsr.io/badges/elysia-autoload/score)](https://jsr.io/elysia-autoload) -->

</div>

Plugin for [Elysia](https://elysiajs.com/) which autoload all routes in directory and code-generate types for [Eden](https://elysiajs.com/eden/overview.html) with [`Bun.build`](#bun-build-usage) and **Node adapter** support!

## Installation

### Start new project with [create-elysiajs](https://github.com/kravetsone/create-elysiajs)

```bash
bun create elysiajs <directory-name>
```

and select `Autoload` in plugins

### Manual

```bash
bun install elysia-autoload
```

## Usage

## Register the plugin

```ts
import { Elysia } from "elysia";
import { autoload } from "elysia-autoload";

const app = new Elysia().use(await autoload()).listen(3000);

export type ElysiaApp = typeof app;
```

### With custom options

```ts
import { Elysia } from "elysia";
import { autoload } from "elysia-autoload";

const app = new Elysia()
    .use(
        await autoload({
            dir: "./routes",
            prefix: "/api",
            // Ignore test files and spec files
            ignore: ["**/*.test.ts", "**/*.spec.ts"]
        })
    )
    .listen(3000);

export type ElysiaApp = typeof app;
```

> [!IMPORTANT]
> We strictly recommend use `await` when registering plugin
>
> Read more about [Lazy-load plugins](https://elysiajs.com/patterns/lazy-loading-module.html)

## Create route

```ts
// routes/index.ts
import type { ElysiaApp } from "app";

export default (app: ElysiaApp) => app.get("", { hello: "world" });
```

### Directory structure

Guide how `elysia-autoload` match routes

```
├── app.ts
├── routes
    ├── index.ts // index routes
    ├── posts
        ├── index.ts
        └── [id].ts // dynamic params
    ├── likes
        └── [...].ts // wildcard
    ├── domains
        ├── @[...] // wildcard with @ prefix
            └──index.ts
    ├── frontend
        └──index.tsx // usage of tsx extension
    ├── events
        └──(post).ts // post and get will not be in the link
        └──(get).ts
    └── users.ts
└── package.json
```

-   /routes/index.ts → /
-   /routes/posts/index.ts → /posts
-   /routes/posts/[id].ts → /posts/:id
-   /routes/users.ts → /users
-   /routes/likes/[...].ts → /likes/\*
-   /routes/domains/@[...]/index.ts → /domains/@\*
-   /routes/frontend/index.tsx → /frontend
-   /routes/events/(post).ts → /events
-   /routes/events/(get).ts → /events

## Options

| Key      | Type                                       | Default                            | Description                                                                         |
| -------- | ------------------------------------------ | ---------------------------------- | ----------------------------------------------------------------------------------- |
| pattern? | string                                     | "\*\*\/\*.{ts,tsx,js,jsx,mjs,cjs}" | [Glob patterns](<https://en.wikipedia.org/wiki/Glob_(programming)>)                 |
| dir?     | string                                     | "./routes"                         | The folder where routes are located                                                 |
| prefix?  | string                                     |                                    | Prefix for routes                                                                   |
| types?   | boolean \| [Types Options](#types-options) | false                              | Options to configure type code-generation. if boolean - enables/disables generation |
| schema?  | Function                                   |                                    | Handler for providing routes guard schema                                           |
| ignore?  | string \| string[]                         |                                    | Glob pattern(s) to ignore when discovering files                                    |

### Types Options

| Key        | Type               | Default             | Description                                                                             |
| ---------- | ------------------ | ------------------- | --------------------------------------------------------------------------------------- |
| output?    | string \| string[] | "./routes-types.ts" | Type code-generation output. It can be an array                                         |
| typeName?  | string             | "Routes"            | Name for code-generated global type for [Eden](https://elysiajs.com/eden/overview.html) |
| useExport? | boolean            | false               | Use export instead of global type                                                       |

### Usage of types code-generation for [Eden](https://elysiajs.com/eden/overview.html)

```ts
// app.ts
import { Elysia } from "elysia";
import { autoload } from "elysia-autoload";

const app = new Elysia()
    .use(
        await autoload({
            types: {
                output: "./routes.ts",
                typeName: "Routes",
            }, // or pass true for use default params
        })
    )
    .listen(3000);

export type ElysiaApp = typeof app;
```

```ts
// client.ts

import { treaty } from "@elysiajs/eden";

// Routes are a global type so you don't need to import it.

const app = treaty<Routes>("http://localhost:3002");

const { data } = await app.test["some-path-param"].get({
    query: {
        key: 2,
    },
});

console.log(data);
```

`routes.ts` will be:

```ts
// @filename: routes.ts

import type { ElysiaWithBaseUrl } from "elysia-autoload";
import type Route0 from "./routes/index";
import type Route1 from "./routes/test/[some]/index";

declare global {
    export type Routes = ElysiaWithBaseUrl<"/api", typeof Route0> &
        ElysiaWithBaseUrl<"/api/test/:some", typeof Route1>;
}
```

Example of app with types code-generation you can see in [example](https://github.com/kravetsone/elysia-autoload/tree/main/example)

### [Bun build](https://bun.sh/docs/bundler) usage

You can use this plugin with [`Bun.build`](https://bun.sh/docs/bundler), thanks to [esbuild-plugin-autoload](https://github.com/kravetsone/esbuild-plugin-autoload)!

```ts
// @filename: build.ts
import { autoload } from "esbuild-plugin-autoload"; // default import also supported

await Bun.build({
    entrypoints: ["src/index.ts"],
    target: "bun",
    outdir: "out",
    plugins: [autoload()],
}).then(console.log);
```

Then, build it with `bun build.ts` and run with `bun out/index.ts`.

### [Bun compile](https://bun.sh/docs/bundler/executables) usage

You can bundle and then compile it into a [single executable binary file](https://bun.sh/docs/bundler/executables)

```ts
import { autoload } from "esbuild-plugin-autoload"; // default import also supported

await Bun.build({
    entrypoints: ["src/index.ts"],
    target: "bun",
    outdir: "out",
    plugins: [autoload()],
}).then(console.log);

await Bun.$`bun build --compile out/index.js`;
```

> [!WARNING]
> You cannot use it in `bun build --compile` mode without extra step ([Feature issue](https://github.com/oven-sh/bun/issues/11895))

[Read more](https://github.com/kravetsone/esbuild-plugin-autoload)

### Usage of schema handler

```ts
import swagger from "@elysiajs/swagger";
import Elysia from "elysia";
import { autoload } from "elysia-autoload";

const app = new Elysia()
    .use(
        await autoload({
            schema: ({ path, url }) => {
                const tag = url.split("/").at(1)!;

                return {
                    beforeHandle: ({ request }) => {
                        console.log(request.url);
                    },
                    detail: {
                        description: `Route autoloaded from ${path}`,
                        tags: [tag],
                    },
                };
            },
        })
    )
    .use(swagger());

export type ElysiaApp = typeof app;

app.listen(3001, console.log);
```

Projects created with ElysiaJS

<img width="363" height="599" alt="image" src="https://github.com/user-attachments/assets/c4c61996-c4ee-4163-8ef6-ed2d8d302190" />

Use autoload as follows

```ts
  .use(
    // @ts-ignore
    await autoload({
      dir: "routes",
      pattern: "**/*.{ts,tsx}",
      // Disable type generation in executable files to avoid permission issues  !!types may cause the packaged exe to lack route path issues, so it is commented out
      // types: {
      //   output: "types/routes.ts",
      //   typeName: "Route",
      // },
      ignore: [
        "**/*.model.ts",
      ],
      tsconfigPath: "./tsconfig.json",
      // @ts-ignore
      schema: ({ path, url, detail }) => {
        // Extract the module name from the URL as a label
        const segments = url.split("/").filter(Boolean);
        const moduleName = segments[0] || "system";
        const defaultTag =
          moduleName.charAt(0).toUpperCase() + moduleName.slice(1);

        // Merge the detail configuration in the routing file
        return {
          detail: {
            ...detail,
            tags: detail?.tags || [defaultTag],
            description: detail?.description || `${defaultTag} 模块 - 自动加载自 ${path}`,
            operationId: detail?.operationId || `${moduleName}_${path.split('/').pop()?.replace('.ts', '')}`,
          },
        };
      },
    }),
  )
```

build 如下：
```ts
#build.ts
#autoload  come form `esbuild-plugin-autoload`
 await Bun.build({
      entrypoints: "./src/index.ts",
      target: "bun",
      outdir: "dist",
      plugins: [
        autoload({
          directory: process.cwd() + "/src/routes",
          pattern: ["**/*.{ts,tsx}", "!**/*.model.ts"],
          debug: false,
        }),
      ],
    });
  await Bun.$`bun build --compile dist/index.js --outfile dist.exe`;
```




