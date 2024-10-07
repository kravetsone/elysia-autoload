import fs from "node:fs";
import path from "node:path";
import {
	type BaseMacro,
	Elysia,
	type InputSchema,
	type LocalHook,
	type RouteSchema,
	type SingletonBase,
} from "elysia";
import type { SoftString } from "./types";
import {
	addRelativeIfNotDot,
	fixSlashes,
	getPath,
	sortByNestedParams,
	transformToUrl,
} from "./utils";

export type * from "./types";

export type SchemaHandler = ({
	path,
	url,
}: {
	path: string;
	url: string;
}) => LocalHook<
	InputSchema,
	RouteSchema,
	SingletonBase,
	Record<string, Error>,
	BaseMacro,
	""
>;

export interface TypesOptions {
	output?: string | string[];
	typeName?: string;
	useExport?: boolean;
}

export interface AutoloadOptions {
	pattern?: string;
	dir?: string;
	prefix?: string;
	schema?: SchemaHandler;
	types?: TypesOptions | true;
	/**
	 * Throws an error if no matches are found.
	 * @default true
	 */
	failGlob?: boolean;
	/**
	 * import a specific `export` from a file
	 * @example import first export
	 * ```ts
	 * import: (file) => Object.keys(file).at(0) || "default",
	 * ```
	 * @default "default"
	 */
	// biome-ignore lint/suspicious/noExplicitAny: import return any
	import?: SoftString<"default"> | ((file: any) => string);
	/**
	 * Skip imports where needed `export` not defined
	 * @default false
	 */
	skipImportErrors?: boolean;
}

const DIR_ROUTES_DEFAULT = "./routes";
const TYPES_OUTPUT_DEFAULT = "./routes-types.ts";
const TYPES_TYPENAME_DEFAULT = "Routes";
const TYPES_OBJECT_DEFAULT = {
	output: [TYPES_OUTPUT_DEFAULT],
	typeName: TYPES_TYPENAME_DEFAULT,
} satisfies TypesOptions;

export async function autoload(options: AutoloadOptions = {}) {
	const { pattern, prefix, schema } = options;
	const failGlob = options.failGlob ?? true;
	const getImportName = options?.import ?? "default";

	const dir = options.dir ?? DIR_ROUTES_DEFAULT;
	// some strange code to provide defaults
	const types: (Omit<TypesOptions, "output"> & { output: string[] }) | false =
		options.types
			? options.types !== true
				? {
						...TYPES_OBJECT_DEFAULT,
						...options.types,
						// This code allows you to omit the output data or specify it as an string[] or string.
						output: !options.types.output
							? [TYPES_OUTPUT_DEFAULT]
							: Array.isArray(options.types.output)
								? options.types.output
								: [options.types.output],
					}
				: TYPES_OBJECT_DEFAULT
			: false;

	const directoryPath = getPath(dir);

	if (!fs.existsSync(directoryPath))
		throw new Error(`Directory ${directoryPath} doesn't exists`);
	if (!fs.statSync(directoryPath).isDirectory())
		throw new Error(`${directoryPath} isn't a directory`);

	const plugin = new Elysia({
		name: "elysia-autoload",
		prefix: fixSlashes(prefix),
		seed: {
			pattern,
			dir,
			prefix,
			types,
		},
	});

	const glob = new Bun.Glob(pattern || "**/*.{ts,tsx,js,jsx,mjs,cjs}");

	const files = await Array.fromAsync(
		glob.scan({
			cwd: directoryPath,
		}),
	);
	if (failGlob && files.length === 0)
		throw new Error(
			`No matches found in ${directoryPath}. You can disable this error by setting the failGlob parameter to false in the options of autoload plugin`,
		);

	const paths: [path: string, exportName: string][] = [];

	for await (const filePath of sortByNestedParams(files)) {
		const fullPath = path.join(directoryPath, filePath);

		const file = await import(fullPath);

		const importName =
			typeof getImportName === "string" ? getImportName : getImportName(file);

		const importedValue = file[importName];
		if (!importedValue)
			if (options?.skipImportErrors)
				continue;
			else
				throw new Error(`${filePath} don't provide export ${importName}`);

		const url = transformToUrl(filePath);

		const groupOptions = schema ? schema({ path: filePath, url }) : {};

		// TODO: fix type-error later
		if (typeof importedValue === "function")
			if (importedValue.length)
				// @ts-expect-error
				plugin.group(url, groupOptions, importedValue);
			else
				// @ts-expect-error
				plugin.group(url, groupOptions, (app) => app.use(importedValue()));
		else if (importedValue instanceof Elysia)
			// @ts-expect-error
			plugin.group(url, groupOptions, (app) => app.use(importedValue));

		if (types) paths.push([fullPath.replace(directoryPath, ""), importName]);
	}

	if (types) {
		for await (const outputPath of types.output) {
			const outputAbsolutePath = getPath(outputPath);

			const imports: string[] = paths.map(
				([x, exportName], index) =>
					`import type ${exportName === "default" ? `Route${index}` : `{ ${exportName} as Route${index} }`} from "${addRelativeIfNotDot(
						path
							.relative(
								path.dirname(outputAbsolutePath),
								directoryPath + x.replace(".ts", "").replace(".tsx", ""),
							)
							.replace(/\\/gu, "/"),
					)}";`,
			);

			await Bun.write(
				outputAbsolutePath,
				[
					`import type { ElysiaWithBaseUrl } from "elysia-autoload";`,
					imports.join("\n"),
					"",
					!types.useExport ? "declare global {" : "",
					`    export type ${types.typeName} = ${paths
						.map(
							([x], index) =>
								`ElysiaWithBaseUrl<"${
									((prefix?.endsWith("/") ? prefix.slice(0, -1) : prefix) ??
										"") + transformToUrl(x) || "/"
								}", typeof Route${index}>`,
						)
						.join("\n              & ")}`,
					!types.useExport ? "}" : "",
				].join("\n"),
			);
		}
	}

	return plugin;
}
