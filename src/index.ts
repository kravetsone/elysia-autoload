import { existsSync, statSync } from "node:fs";
import { join } from "node:path";
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

export async function autoload(options: IAutoloadOptions = {}) {
	const { pattern, dir, prefix, schema, types } = options;

	const directoryPath = getPath(dir || "./routes");

	if (!existsSync(directoryPath))
		throw new Error(`Directory ${directoryPath} doesn't exists`);
	if (!statSync(directoryPath).isDirectory())
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

	for await (const path of sortByNestedParams(files)) {
		const fullPath = join(directoryPath, path);

		const file = await import(fullPath);

		if (!file.default)
			throw new Error(`${path} doesn't provide default export`);
		const url = transformToUrl(path);

		const groupOptions = schema ? schema({ path, url }) : {};
		// TODO: fix later
		// @ts-expect-error
		plugin.group(url, groupOptions, file.default);

		if (types) paths.push(fullPath.replace(directoryPath, ""));
	}

	if (types) {
		const imports: string[] = paths.map(
			(x, index) =>
				`import type Route${index} from "${(
					directoryPath + x.replace(".ts", "").replace(".tsx", "")
				).replace(/\\/gu, "/")}";`,
		);

		for await (const outputPath of types === true || !types.output
			? [TYPES_OUTPUT_DEFAULT]
			: Array.isArray(types.output)
				? types.output
				: [types.output]) {
			await Bun.write(
				getPath(outputPath),
				[
					`import type { ElysiaWithBaseUrl } from "elysia-autoload";`,
					imports.join("\n"),
					"",
					types === true || !types.useExport ? "declare global {" : "",
					`    export type ${
						types === true || !types.typeName
							? TYPES_TYPENAME_DEFAULT
							: types.typeName
					} = ${paths
						.map(
							(x, index) =>
								`ElysiaWithBaseUrl<"${
									((prefix?.endsWith("/") ? prefix.slice(0, -1) : prefix) ??
										"") + transformToUrl(x) || "/"
								}", ReturnType<typeof Route${index}>>`,
						)
						.join("\n              & ")}`,
					types === true || !types.useExport ? "}" : "",
				].join("\n"),
			);
		}
	}

	return plugin;
}
export * from "./types";
