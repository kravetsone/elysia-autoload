import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
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
	globSync,
	matchesPattern,
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
	/**
	 * Glob pattern(s) to ignore when discovering files
	 */
	ignore?: string | string[];
	/**
	 * Path to tsconfig.json file for module resolution detection
	 * @default "tsconfig.json"
	 */
	tsconfigPath?: string;
}

/**
 * Check if TypeScript extensions should be kept based on tsconfig.json settings
 * @param tsconfigPath - Optional path to tsconfig.json file
 * @returns Promise<boolean> - true if extensions should be kept
 */
async function shouldKeepTsExtension(tsconfigPath?: string): Promise<boolean> {
	try {
		const configPath = tsconfigPath
			? path.resolve(tsconfigPath)
			: path.join(process.cwd(), "tsconfig.json");

		// Support both Bun and Node.js environments
		let fileContent: string;
		if (typeof Bun === "undefined") {
			// Node.js environment
			fileContent = fs.readFileSync(configPath, "utf-8");
		} else {
			// Bun environment
			fileContent = await Bun.file(configPath).text();
		}

		const tsConfig = JSON.parse(fileContent);

		const moduleOption = (tsConfig.compilerOptions?.module || "").toLowerCase();
		const moduleResolutionOption = (
			tsConfig.compilerOptions?.moduleResolution || ""
		).toLowerCase();

		return (
			moduleOption === "nodenext" ||
			moduleOption === "node16" ||
			moduleResolutionOption === "nodenext" ||
			moduleResolutionOption === "node16"
		);
	} catch (error) {
		return false;
	}
}

const DIR_ROUTES_DEFAULT = "./routes";
const TYPES_OUTPUT_DEFAULT = "./routes-types.ts";
const TYPES_TYPENAME_DEFAULT = "Routes";
const TYPES_OBJECT_DEFAULT = {
	output: [TYPES_OUTPUT_DEFAULT],
	typeName: TYPES_TYPENAME_DEFAULT,
} satisfies TypesOptions;

export async function autoload(options: AutoloadOptions = {}) {
	const { pattern, prefix, schema, ignore, tsconfigPath } = options;
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
			ignore,
		},
	});

	const globPattern = pattern || "**/*.{ts,tsx,js,jsx,mjs,cjs}";
	const globOptions = { cwd: directoryPath };

	let files = globSync(globPattern, globOptions);

	// Filter out ignored files
	if (ignore) {
		const ignorePatterns = Array.isArray(ignore) ? ignore : [ignore];
		files = files.filter((filePath) => {
			return !ignorePatterns.some((pattern) =>
				matchesPattern(filePath, pattern),
			);
		});
	}

	if (failGlob && files.length === 0)
		throw new Error(
			`No matches found in ${directoryPath}. You can disable this error by setting the failGlob parameter to false in the options of autoload plugin`,
		);

	const paths: [path: string, exportName: string][] = [];

	for (const filePath of sortByNestedParams(files)) {
		const fullPath = path.join(directoryPath, filePath);
		const file = await import(pathToFileURL(fullPath).href);

		const importName =
			typeof getImportName === "string" ? getImportName : getImportName(file);

		const importedValue = file[importName];
		if (!importedValue) {
			if (options?.skipImportErrors) continue;
			throw new Error(`${filePath} don't provide export ${importName}`);
		}

		const url = transformToUrl(filePath);

		const groupOptions = schema ? schema({ path: filePath, url }) : {};

		// TODO: fix type-error later
		if (typeof importedValue === "function")
			if (importedValue.length > 0)
				// @ts-expect-error
				plugin.group(url, groupOptions, importedValue);
			// @ts-expect-error
			else plugin.group(url, groupOptions, (app) => app.use(importedValue()));
		else if (importedValue instanceof Elysia)
			// @ts-expect-error
			plugin.group(url, groupOptions, (app) => app.use(importedValue));

		if (types) paths.push([fullPath.replace(directoryPath, ""), importName]);
	}

	if (types) {
		// Parse tsconfig.json once outside the loop to avoid repeated file reads
		const needsExtension = await shouldKeepTsExtension(tsconfigPath);
		for await (const outputPath of types.output) {
			const outputAbsolutePath = getPath(outputPath);

			const imports: string[] = paths.map(([filePath, exportName], index) => {
				const importPath = needsExtension
					? filePath
					: filePath.replace(/\.(ts|tsx)$/, "");

				return `import type ${exportName === "default" ? `Route${index}` : `{ ${exportName} as Route${index} }`} from "${addRelativeIfNotDot(
					path
						.relative(
							path.dirname(outputAbsolutePath),
							path.join(directoryPath, importPath),
						)
						.replaceAll("\\", "/"),
				)}";`;
			});

			const input = [
				`import type { ElysiaWithBaseUrl } from "elysia-autoload";`,
				imports.join("\n"),
				"",
				!types.useExport ? "declare global {" : "",
				`    export type ${types.typeName} = ${paths
					.map(
						([x], index) =>
							`ElysiaWithBaseUrl<"${
								((prefix?.endsWith("/") ? prefix.slice(0, -1) : prefix) ?? "") +
									transformToUrl(x) || "/"
							}", typeof Route${index}>`,
					)
					.join("\n              & ")}`,
				!types.useExport ? "}" : "",
			].join("\n");
			if (typeof Bun === "undefined") {
				fs.writeFileSync(outputAbsolutePath, input);
			} else {
				await Bun.write(outputAbsolutePath, input);
			}
		}
	}

	return plugin;
}
