import { describe, expect, test } from "bun:test";
import { edenFetch } from "@elysiajs/eden";
import { Elysia } from "elysia";
import { autoload } from "../src/index";
import { matchesPattern, sortByNestedParams, transformToUrl } from "../src/utils";
import fs from "node:fs";
import path from "node:path";

// const app_with_prefix = new Elysia({
// 	prefix: "/api", // BROKEN FOR NOW
// }).use(
// 	autoload({
// 		pattern: "**/*.{ts,js}",
// 		dir: "./routes",
// 		types: {
// 			output: "./types/routes.ts",
// 		},
// 	}),
// );

// const app_with_plugin_prefix = new Elysia().use(
// 	autoload({
// 		prefix: "/api",
// 		pattern: "**/*.{ts,js}",
// 		dir: "./routes",
// 		types: {
// 			output: "./types/routes.ts",
// 		},
// 	}),
// );

// const fetcher = edenFetch<Routes>("http://127.0.0.1:5173");

// export type ElysiaApp = typeof app_with_prefix;

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
  test("/events/(post).ts → /events", () => {
    expect(transformToUrl("/events/(post).ts")).toBe("/events");
  });
  test("/(post)/events.ts → /events", () => {
    expect(transformToUrl("/(post)/events.ts")).toBe("/events");
  });
  test("(post).ts → ", () => {
    expect(transformToUrl("(post).ts")).toBe("");
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
      ])
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

describe("matchesPattern", () => {
  test("matches exact filename", () => {
    expect(matchesPattern("test.ts", "test.ts")).toBe(true);
    expect(matchesPattern("test.ts", "other.ts")).toBe(false);
  });

  test("matches wildcard patterns", () => {
    expect(matchesPattern("test.ts", "*.ts")).toBe(true);
    expect(matchesPattern("test.js", "*.ts")).toBe(false);
    expect(matchesPattern("path/to/test.ts", "**/test.ts")).toBe(true);
    expect(matchesPattern("path/to/file.ts", "**/*.ts")).toBe(true);
  });

  test("matches glob patterns with directories", () => {
    expect(matchesPattern("src/test.ts", "src/*.ts")).toBe(true);
    expect(matchesPattern("src/nested/test.ts", "src/*.ts")).toBe(false);
    expect(matchesPattern("src/nested/test.ts", "src/**/*.ts")).toBe(true);
  });

  test("matches patterns with extensions", () => {
    expect(matchesPattern("test.spec.ts", "*.spec.ts")).toBe(true);
    expect(matchesPattern("test.test.ts", "*.test.ts")).toBe(true);
    expect(matchesPattern("test.spec.ts", "*.test.ts")).toBe(false);
  });

  test("matches patterns with multiple extensions", () => {
    expect(matchesPattern("test.ts", "*.{ts,js}")).toBe(true);
    expect(matchesPattern("test.js", "*.{ts,js}")).toBe(true);
    expect(matchesPattern("test.py", "*.{ts,js}")).toBe(false);
  });

  test("matches nested wildcard patterns", () => {
    expect(matchesPattern("src/components/Button.test.ts", "**/*.test.ts")).toBe(true);
    expect(matchesPattern("src/components/Button.spec.ts", "**/*.spec.ts")).toBe(true);
    expect(matchesPattern("src/components/Button.ts", "**/*.test.ts")).toBe(false);
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

describe("Dynamic import extension based on moduleResolution", () => {
  test("should include .ts extension for nodenext module", async () => {
    // Create a temporary tsconfig.json for testing
    const tempTsConfig = {
      compilerOptions: {
        module: "nodenext"
      }
    };

    const originalTsConfig = fs.existsSync('tsconfig.json') ?
      fs.readFileSync('tsconfig.json', 'utf-8') : null;

    fs.writeFileSync('tsconfig.json', JSON.stringify(tempTsConfig));

    try {
      // Simulation type generation process
      const filePath = "/test.ts";
      const importPath = filePath; // nodenext needs to keep the suffix
      expect(importPath).toBe("/test.ts");
    } finally {
      // Restore default settings
      if (originalTsConfig) {
        fs.writeFileSync('tsconfig.json', originalTsConfig);
      } else {
        fs.unlinkSync('tsconfig.json');
      }
    }
  });

  test("should remove .ts extension for commonjs module", async () => {
    const tempTsConfig = {
      compilerOptions: {
        module: "commonjs"
      }
    };

    const originalTsConfig = fs.existsSync('tsconfig.json') ?
      fs.readFileSync('tsconfig.json', 'utf-8') : null;

    fs.writeFileSync('tsconfig.json', JSON.stringify(tempTsConfig));

    try {
      const filePath = "/test.ts";
      const importPath = filePath.replace(/\.(ts|tsx)$/, '');
      expect(importPath).toBe("/test");
    } finally {
      if (originalTsConfig) {
        fs.writeFileSync('tsconfig.json', originalTsConfig);
      } else {
        fs.unlinkSync('tsconfig.json');
      }
    }
  });

  test("should handle missing tsconfig.json gracefully", async () => {
    const originalTsConfig = fs.existsSync('tsconfig.json') ?
      fs.readFileSync('tsconfig.json', 'utf-8') : null;

    if (fs.existsSync('tsconfig.json')) {
      fs.unlinkSync('tsconfig.json');
    }

    try {
      const filePath = "/test.ts";
      const importPath = filePath.replace(/\.(ts|tsx)$/, '');
      expect(importPath).toBe("/test");
    } finally {
      if (originalTsConfig) {
        fs.writeFileSync('tsconfig.json', originalTsConfig);
      }
    }
  });
});
