import type { ElysiaWithBaseUrl } from "elysia-autoload";
import type Route0 from "./routes/index";
import type Route1 from "./routes/test/[some]/index";

declare global {
    export type Routes = ElysiaWithBaseUrl<"/api", ReturnType<typeof Route0>>
              & ElysiaWithBaseUrl<"/api/test/:some", ReturnType<typeof Route1>>
}