import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

export function getPath(dir: string) {
	if (path.isAbsolute(dir)) return dir;
	if (path.isAbsolute(process.argv[1]))
		return path.join(process.argv[1], "..", dir);

	return path.join(process.cwd(), process.argv[1], "..", dir);
}

// Inspired by https://github.com/wobsoriano/elysia-autoroutes/blob/main/src/utils/transformPathToUrl.ts#L4C31-L4C31
export function transformToUrl(path: string) {
	return (
		path
			// Clean the url extensions
			.replace(/\.(ts|tsx|js|jsx|mjs|cjs)$/u, "")
			// Fix windows slashes
			.replaceAll("\\", "/")
			// Handle wild card based routes - users/[...id]/profile.ts -> users/*/profile
			.replaceAll(/\[\.\.\..*\]/gu, "*")
			// Handle generic square bracket based routes - users/[id]/index.ts -> users/:id
			.replaceAll(/\[(.*?)\]/gu, (_: string, match: string) => `:${match}`)
			.replace(/\/?\((.*)\)/, "")
			// Handle the case when multiple parameters are present in one file
			// users / [id] - [name].ts to users /: id -:name and users / [id] - [name] / [age].ts to users /: id -: name /: age
			.replaceAll("]-[", "-:")
			.replaceAll("]/", "/")
			.replaceAll(/\[|\]/gu, "")
			// remove index from end of path
			.replace(/\/?index$/, "")
	);
}

function getParamsCount(path: string) {
	return path.match(/\[(.*?)\]/gu)?.length || 0;
}

// Is it necessary?..
// Sorts by the smallest parameters
export function sortByNestedParams(routes: string[]): string[] {
	return routes.sort((a, b) => getParamsCount(a) - getParamsCount(b));
}

export function fixSlashes(prefix?: string) {
	if (!prefix?.endsWith("/")) return prefix;

	return prefix.slice(0, -1);
}

export function addRelativeIfNotDot(path: string) {
	if (path.at(0) !== ".") return `./${path}`;

	return path;
}

//#region https://github.com/vikejs/vike/blob/main/vike/utils/getRandomId.ts
function getRandomId(length: number): string {
	let randomId = "";
	while (randomId.length < length) {
		randomId += Math.random().toString(36).slice(2);
	}
	return randomId.slice(0, length);
}
//#endregion

//#region https://github.com/vikejs/vike/blob/main/vike/node/plugin/plugins/importUserCode/v1-design/getVikeConfig/transpileAndExecuteFile.ts
/**
 * Transpile a file with esbuild
 */
async function transpileWithEsbuild(filePath: string): Promise<string> {
	const esbuild = await import("esbuild");
	const result = await esbuild.build({
		platform: "node",
		entryPoints: [filePath],
		write: false,
		target: ["esnext"],
		logLevel: "silent",
		format: "esm",
		absWorkingDir: process.cwd(),
		bundle: true,
	});

	return result.outputFiles[0].text;
}

/**
 * Get a temporary file path
 */
function getTemporaryBuildFilePath(filePathAbsoluteFilesystem: string): string {
	const dirname = path.posix.dirname(filePathAbsoluteFilesystem);
	const filename = path.posix.basename(filePathAbsoluteFilesystem);
	return path.posix.join(dirname, `${filename}.build-${getRandomId(12)}.mjs`);
}

/**
 * Execute a file
 * Old function name: `executeTranspiledFile`
 */
export async function importFile(
	filePath: string,
): Promise<Record<string, unknown>> {
	const code = await transpileWithEsbuild(filePath);
	const filePathTmp = getTemporaryBuildFilePath(filePath);
	fs.writeFileSync(filePathTmp, code);
	try {
		return await import(pathToFileURL(filePathTmp).href);
	} finally {
		// Clean
		fs.unlinkSync(filePathTmp);
	}
}
//#endregion
