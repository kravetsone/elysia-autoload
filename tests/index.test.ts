import { describe, expect, test } from "bun:test";
import { edenFetch } from "@elysiajs/eden";
import { Elysia } from "elysia";
import { autoload } from "../src/index";
import { sortByNestedParams, transformToUrl } from "../src/utils";

const app_with_prefix = new Elysia({
	prefix: "/api",
}).use(
	autoload({
		pattern: "**/*.{ts,js}",
		dir: "./routes",
		types: {
			output: "./types/routes.ts",
		},
	}),
);

const app_with_plugin_prefix = new Elysia().use(
	autoload({
		prefix: "/api",
		pattern: "**/*.{ts,js}",
		dir: "./routes",
		types: {
			output: "./types/routes.ts",
		},
	}),
);

const fetcher = edenFetch<Routes>("http://127.0.0.1:5173");

export type ElysiaApp = typeof app_with_prefix;

describe("Path to URL", () => {
	test("/index.ts → ", () => {
		expect(transformToUrl("/index.ts")).toBe("");
	});
	test("/posts/index.ts → /posts", () => {
		expect(transformToUrl("/posts/index.ts")).toBe("/posts");
	});
	test("/posts/[id].ts → /posts/:id", () => {
		expect(transformToUrl("/posts/[id].ts")).toBe("/posts/:id");
	});
	test("/users.ts → /users", () => {
		expect(transformToUrl("/users.ts")).toBe("/users");
	});
	test("/likes/[...].ts → /likes/*", () => {
		expect(transformToUrl("/likes/[...].ts")).toBe("/likes/*");
	});
	test("/domains/@[...]/index.ts → /domains/@*", () => {
		expect(transformToUrl("/domains/@[...]/index.ts")).toBe("/domains/@*");
	});
	test("/frontend/index.tsx → /frontend", () => {
		expect(transformToUrl("/frontend/index.tsx")).toBe("/frontend");
	});
});

describe("sortByNestedParams", () => {
	test("Place routes with params to the end of array", () => {
		expect(
			sortByNestedParams([
				"/index.ts",
				"/likes/test.ts",
				"/domains/[test]/some.ts",
				"/domains/[test]/[some].ts",
				"/likes/[...].ts",
				"/posts/some.ts",
				"/posts/[id].ts",
			]),
		).toEqual([
			"/index.ts",
			"/likes/test.ts",
			"/posts/some.ts",
			"/domains/[test]/some.ts",
			"/likes/[...].ts",
			"/posts/[id].ts",
			"/domains/[test]/[some].ts",
		]);
	});

	test("Verify Intellisense", () => {
		// const request = fetcher("", {});
	});
});

// describe("Autoload Plugin", () => {
// 	test("Prefix works when added as a parameter to the plugin", async () => {
// 		// autoload plugin is lazy-load
// 		app_with_plugin_prefix.listen(7754, () => {
// 			// Extract the route paths from the routes array
// 			const routePaths = app_with_plugin_prefix.routes.map(
// 				(route) => route.path,
// 			);

// 			expect(routePaths).toContain("/api/");
// 			expect(routePaths).toContain("/api/users/:id/");
// 		});
// 	});

// 	test("Prefix works when added to Elysia()", async () => {
// 		// Extract the route paths from the routes array
// 		const routePaths = app_with_prefix.routes.map((route) => route.path);

// 		expect(routePaths).toContain("/api/");
// 		expect(routePaths).toContain("/api/users/:id/");
// 	});
// });
