import type { ElysiaWithBaseUrl } from "elysia-autoload";
import type Route0 from "/root/dev/elysia-autoload/tests/routes/index";
import type Route1 from "/root/dev/elysia-autoload/tests/routes/users/[id]";

declare global {
    export type Routes = ElysiaWithBaseUrl<"/api", ReturnType<typeof Route0>>
              & ElysiaWithBaseUrl<"/api/users/:id", ReturnType<typeof Route1>>
}