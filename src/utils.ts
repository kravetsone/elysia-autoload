import fs from "node:fs";
import path from "node:path";

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

export const IS_BUN = typeof Bun !== "undefined";

export function globSync(globPattern: string, globOptions: { cwd?: string }) {
	return IS_BUN
		? Array.from(new Bun.Glob(globPattern).scanSync(globOptions))
		: fs.globSync(globPattern, globOptions);
}

export function matchesPattern(filePath: string, pattern: string): boolean {
	if (IS_BUN) {
		const glob = new Bun.Glob(pattern);
		return glob.match(filePath);
	}
	// For Node.js, we'll use minimatch-style pattern matching
	// First escape special regex characters except glob characters
	let regexPattern = pattern
		.replace(/[.+^${}()|[\]\\]/g, "\\$&")
		.replace(/\\\*/g, "*")
		.replace(/\\\?/g, "?");

	// Then convert glob patterns to regex
	regexPattern = regexPattern
		.replace(/\*\*/g, "§§§")
		.replace(/\*/g, "[^/]*")
		.replace(/§§§/g, ".*")
		.replace(/\?/g, ".")
		.replace(/\{([^}]+)\}/g, (_: string, group: string) => {
			const options = group.split(",").map((s) => s.trim());
			return `(${options.join("|")})`;
		});

	const regex = new RegExp(`^${regexPattern}$`);
	return regex.test(filePath);
}
