import type { ElysiaWithBaseUrl } from "elysia-autoload";
import Route0 from "/root/elysia-autoload/example/routes/index";
import Route1 from "/root/elysia-autoload/example/routes/test/[some]/index";

declare global {
    type Routes = ElysiaWithBaseUrl<"/", ReturnType<typeof Route0>>
              & ElysiaWithBaseUrl<"/test/:some", ReturnType<typeof Route1>>
}