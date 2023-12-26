# elysia-autoload

Plugin for [Elysia](https://elysiajs.com/) which autoload all routes in directory and code-generate types for Eden

## Installation

```bash
bun install elysia-autoload
```

## Usage

## Register the plugin

```ts
import { Elysia } from "elysia";
import { autoload } from "elysia-autoload";

const app = new Elysia().use(autoload()).listen(3000);

export type ElysiaApp = typeof app;
```

## Create route

```ts
// routes/index.ts
import type { ElysiaApp } from "app";

export default (app: ElysiaApp) => app.get("/", { hello: "world" });
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
        ├── [...].ts
    └── users.ts
└── package.json
```

-   /routes/index.ts → /
-   /routes/posts/index.ts → /posts
-   /routes/posts/[id].ts → /posts/:id
-   /routes/users.ts → /users
-   /routes/likes/[...].ts → /likes/\*

## Options

| Key      | Type                                    | Default                     | Description                                                         |
| -------- | --------------------------------------- | --------------------------- | ------------------------------------------------------------------- |
| pattern? | string                                  | "\*\*_/\*_.{ts,js,mjs,cjs}" | [Glob patterns](<https://en.wikipedia.org/wiki/Glob_(programming)>) |
| dir?     | string                                  | "./routes"                  | The folder where routes are located                                 |
| prefix?  | string                                  |                             | Prefix for routes                                                   |
| types?   | true \| [Types Options](#types-options) |                             | Options to configure type code-generation.                          |
| schema?  | Function                                |                             | Handler for providing routes guard schema                           |

### Types Options

| Key       | Type   | Default             | Description                                  |
| --------- | ------ | ------------------- | -------------------------------------------- |
| output?   | string | "./routes-types.ts" | Type code-generation output                  |
| typeName? | string | "Routes"            | Name for code-generated global type for Eden |

### Usage of types code-generation for eden

```ts
// app.ts
import { Elysia } from "elysia";
import { autoload } from "elysia-autoload";

const app = new Elysia()
    .use(
        autoload({
            types: {
                output: "./routes.ts",
                typeName: "Routes",
            }, // or pass true for use default params
        }),
    )
    .listen(3000);

export type ElysiaApp = typeof app;
```

```ts
// client.ts

import { edenTreaty } from "@elysiajs/eden";

// Routes are a global type so you don't need to import it.

const app = edenTreaty<Routes>("http://localhost:3002");

const { data } = await app.test["some-path-param"].get({
    $query: {
        key: 2,
    },
});

console.log(data);
```

Example of app with types code-generation you can see in [example](https://github.com/kravetsone/elysia-autoload/tree/main/example)

### Usage of schema handler

```ts
import swagger from "@elysiajs/swagger";
import Elysia from "elysia";
import { autoload } from "elysia-autoload";

const app = new Elysia()
    .use(
        autoload({
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
        }),
    )
    .use(swagger());

export type ElysiaApp = typeof app;

app.listen(3001, console.log);
```

### Thanks [https://github.com/wobsoriano/elysia-autoroutes](elysia-autoroutes) for some ideas
