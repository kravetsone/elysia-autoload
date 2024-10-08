import path from "node:path";

export function getPath(dir: string) {
    if (path.isAbsolute(dir)) return dir;
    if (path.isAbsolute(process.argv[1]))
        return path.join(process.argv[1], "..", dir);

    return path.join(process.cwd(), process.argv[1], "..", dir);
}

// Inspired by https://github.com/wobsoriano/elysia-autoroutes/blob/main/src/utils/transformPathToUrl.ts#L4C31-L4C31
export function transformToUrl(path: string) {
    const replacements = [
        // Clean the url extensions
        { regex: /\.(ts|tsx|js|jsx|mjs|cjs)$/u, replacement: "" },
        // Fix windows slashes
        { regex: /\\/gu, replacement: "/" },

        // Handle wild card based routes - users/[...id]/profile.ts -> users/*/profile
        { regex: /\[\.\.\..*\]/gu, replacement: "*" },

        // Handle generic square bracket based routes - users/[id]/index.ts -> users/:id
        {
            regex: /\[(.*?)\]/gu,
            replacement: (_: string, match: string) => `:${match}`,
        },
        {
            regex: /\/?\((.*)\)/,
            replacement: "",
        },
        // Handle the case when multiple parameters are present in one file
        // users / [id] - [name].ts to users /: id -:name and users / [id] - [name] / [age].ts to users /: id -: name /: age
        { regex: /\]-\[/gu, replacement: "-:" },
        { regex: /\]\//gu, replacement: "/" },
        { regex: /\[|\]/gu, replacement: "" },
        // remove index from end of path
        { regex: /\/?index$/, replacement: "" },
    ];

    let url = path;

    for (const { regex, replacement } of replacements) {
        url = url.replace(regex, replacement as string);
    }

    return url;
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
