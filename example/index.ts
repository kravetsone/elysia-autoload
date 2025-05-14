import { node } from "@elysiajs/node";
import { swagger } from "@elysiajs/swagger";
import { Elysia } from "elysia";
import { autoload } from "elysia-autoload";

const prefix = "/api/" as const;

export const app = new Elysia({
	prefix: "/test",
	// adapter: node(),
})
	.use(swagger())
	.use(
		await autoload({
			prefix,
			types: {
				output: "routes.ts",
				typeName: "Routes",
			},
		}),
	);

await app.modules;

app.listen(3002, () =>
	console.log(
		"started",
		"http://localhost:3002/test/api",
		app.routes.map((x) => x.path),
	),
);

export type ElysiaApp = typeof app;
