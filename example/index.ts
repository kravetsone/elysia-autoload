import { swagger } from "@elysiajs/swagger";
import { Elysia } from "elysia";
import { autoload } from "elysia-autoload";

const app = new Elysia().use(swagger()).use(
    autoload({
        types: {
            output: "./routes.ts",
            typeName: "Routes",
        },
    }),
);

app.listen(3002);

export type ElysiaApp = typeof app;
