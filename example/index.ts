import { swagger } from "@elysiajs/swagger";
import { Elysia } from "elysia";
import { autoload } from "elysia-autoload";

const prefix = "/api/" as const;

const app = new Elysia().use(swagger()).use(
	autoload({
		prefix,
		types: {
			output: "routes.ts",
			typeName: "Routes",
		},
	}),
);

app.listen(3002, () => console.log("started"));

export type ElysiaApp = typeof app;
