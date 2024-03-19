import type { ElysiaWithBaseUrl } from "elysia-autoload";
import type Route0 from "Z:/PROJECTS/node-ts/elysia-autoload/tests/routes/index";
import type Route1 from "Z:/PROJECTS/node-ts/elysia-autoload/tests/routes/users/[id]";

declare global {
    export type Routes = ElysiaWithBaseUrl<"/", ReturnType<typeof Route0>>
              & ElysiaWithBaseUrl<"/users/:id", ReturnType<typeof Route1>>
}