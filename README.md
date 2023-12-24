# elysia-autoload

Plugin for [Elysia](https://elysiajs.com/) which autoload all routes in directory

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

| Key      | Type     | Default                     | Description                                                         |
| -------- | -------- | --------------------------- | ------------------------------------------------------------------- |
| pattern? | string   | "\*\*_/\*_.{ts,js,mjs,cjs}" | [Glob patterns](<https://en.wikipedia.org/wiki/Glob_(programming)>) |
| dir?     | string   | "./routes"                  | The folder where routes are located                                 |
| prefix?  | string   |                             | Prefix for routes                                                   |
| schema?  | Function |                             | Handler for providing routes guard schema                           |

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
