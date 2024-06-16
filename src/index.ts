import fs from "node:fs";
import path from "node:path";
import {
	Elysia,
	type InputSchema,
	type LocalHook,
	type RouteSchema,
	type SingletonBase,
} from "elysia";
import type { BaseMacro } from "elysia/dist/types";
import {
	fixSlashes,
	getPath,
	sortByNestedParams,
	transformToUrl,
} from "./utils";

type TSchemaHandler = ({
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

export interface ITypesOptions {
	output?: string | string[];
	typeName?: string;
	useExport?: boolean;
}

export interface IAutoloadOptions {
	pattern?: string;
	dir?: string;
	prefix?: string;
	schema?: TSchemaHandler;
	types?: ITypesOptions | true;
}

const TYPES_OUTPUT_DEFAULT = "./routes-types.ts";
const TYPES_TYPENAME_DEFAULT = "Routes";
const TYPES_OBJECT_DEFAULT = {
	output: [TYPES_OUTPUT_DEFAULT],
	typeName: TYPES_TYPENAME_DEFAULT,
} satisfies ITypesOptions;

export async function autoload(options: IAutoloadOptions = {}) {
	// autoload-plugin-sources
	const fileSources = {};

	const { pattern, dir, prefix, schema } = options;

	// some strange code to provide defaults
	const types: Omit<ITypesOptions, "output"> & { output: string[] } =
		options.types && options.types !== true
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
			: TYPES_OBJECT_DEFAULT;

	const directoryPath = getPath(dir || "./routes");

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

	const paths: string[] = [];

	for await (const filePath of sortByNestedParams(files)) {
		const fullPath = path.join(directoryPath, filePath);

		const file = await import(fullPath);

		if (!file.default)
			throw new Error(`${filePath} doesn't provide default export`);
		const url = transformToUrl(filePath);

		const groupOptions = schema ? schema({ path: filePath, url }) : {};
		// TODO: fix later
		// @ts-expect-error
		plugin.group(url, groupOptions, file.default);

		if (types) paths.push(fullPath.replace(directoryPath, ""));
	}

	// esbuild-plugin-autoload remove-start
	if (types) {
		const imports: string[] = paths.map(
			(x, index) =>
				`import type Route${index} from "${(
					directoryPath + x.replace(".ts", "").replace(".tsx", "")
				).replace(/\\/gu, "/")}";`,
		);

		for await (const outputPath of types.output) {
			await Bun.write(
				getPath(outputPath),
				[
					`import type { ElysiaWithBaseUrl } from "elysia-autoload";`,
					imports.join("\n"),
					"",
					!types.useExport ? "declare global {" : "",
					`    export type ${
						!types.typeName ? TYPES_TYPENAME_DEFAULT : types.typeName
					} = ${paths
						.map(
							(x, index) =>
								`ElysiaWithBaseUrl<"${
									((prefix?.endsWith("/") ? prefix.slice(0, -1) : prefix) ??
										"") + transformToUrl(x) || "/"
								}", ReturnType<typeof Route${index}>>`,
						)
						.join("\n              & ")}`,
					!types.useExport ? "}" : "",
				].join("\n"),
			);
		}
	}

	// esbuild-plugin-autoload remove-end
	return plugin;
}
export * from "./types";
