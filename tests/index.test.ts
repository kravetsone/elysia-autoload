import { describe, expect, test } from "bun:test";
import { sortByNestedParams, transformToUrl } from "../src/utils";

describe("Path to URL", () => {
	test("/index.ts → /", () => {
		expect(transformToUrl("/index.ts")).toBe("/");
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
});
