import type { ElysiaWithBaseUrl } from "elysia-autoload";
import type Route0 from "../routes/index";
import type Route1 from "../routes/users/[id]";

declare global {
    export type Routes = ElysiaWithBaseUrl<"/", ReturnType<typeof Route0>>
              & ElysiaWithBaseUrl<"/users/:id", ReturnType<typeof Route1>>
}