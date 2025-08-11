import type { ElysiaWithBaseUrl } from "elysia-autoload";
import type Route0 from "./routes/index.ts";
import type Route1 from "./routes/exports/default.ts";
import type Route2 from "./routes/exports/elysia.ts";
import type Route3 from "./routes/exports/zero-aguments.ts";
import type Route4 from "./routes/test/[some]/index.ts";

declare global {
    export type Routes = ElysiaWithBaseUrl<"/api", typeof Route0>
              & ElysiaWithBaseUrl<"/api/exports/default", typeof Route1>
              & ElysiaWithBaseUrl<"/api/exports/elysia", typeof Route2>
              & ElysiaWithBaseUrl<"/api/exports/zero-aguments", typeof Route3>
              & ElysiaWithBaseUrl<"/api/test/:some", typeof Route4>
}