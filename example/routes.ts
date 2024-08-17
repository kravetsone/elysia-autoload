import type { ElysiaWithBaseUrl } from "elysia-autoload";
import type Route0 from "./routes/index";
import type Route1 from "./routes/exports/default";
import type Route2 from "./routes/exports/elysia";
import type Route3 from "./routes/exports/zero-aguments";
import type Route4 from "./routes/test/[some]/index";

declare global {
    export type Routes = ElysiaWithBaseUrl<"/api", ReturnType<typeof Route0>>
              & ElysiaWithBaseUrl<"/api/exports/default", ReturnType<typeof Route1>>
              & ElysiaWithBaseUrl<"/api/exports/elysia", ReturnType<typeof Route2>>
              & ElysiaWithBaseUrl<"/api/exports/zero-aguments", ReturnType<typeof Route3>>
              & ElysiaWithBaseUrl<"/api/test/:some", ReturnType<typeof Route4>>
}