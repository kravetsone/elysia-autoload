import { swagger } from "@elysiajs/swagger";
import { Elysia } from "elysia";
import { autoload } from "../src";

const prefix = "/api/" as const;

export const app = new Elysia({
	prefix: "/test",
})
	.use(swagger())
	.use(
		autoload({
			prefix,
			// types: {
			// 	output: "routes.ts",
			// 	typeName: "Routes",
			// },
		}),
	);

app.listen(3002, () => console.log("started"));

export type ElysiaApp = typeof app;
