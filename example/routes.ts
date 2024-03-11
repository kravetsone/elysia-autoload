import type { ElysiaWithBaseUrl } from "elysia-autoload";
import type Route0 from "Z:/PROJECTS/node-ts/elysia-autoload/example/routes/index";
import type Route1 from "Z:/PROJECTS/node-ts/elysia-autoload/example/routes/test/[some]/index";

declare global {
    export type Routes = ElysiaWithBaseUrl<"/api", ReturnType<typeof Route0>>
              & ElysiaWithBaseUrl<"/api/test/:some", ReturnType<typeof Route1>>
}