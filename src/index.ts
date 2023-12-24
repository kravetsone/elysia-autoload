import Elysia from "elysia";
import fs from "node:fs";
import { join } from "node:path";
import { getPath, sortByNestedParams, transformToUrl } from "./utils";

export interface AutoloadOptions {
    pattern?: string;
    dir?: string;
    prefix?: string;
    schema?: ({
        path,
        url,
    }: {
        path: string;
        url: string;
    }) => Parameters<InstanceType<typeof Elysia>["group"]>[1];
}

export async function autoload({
    pattern,
    dir,
    prefix,
    schema,
}: AutoloadOptions = {}) {
    const directoryPath = getPath(dir || "./routes");

    if (!fs.existsSync(directoryPath))
        throw new Error(`Directory ${directoryPath} doesn't exists`);
    if (!fs.statSync(directoryPath).isDirectory())
        throw new Error(`${directoryPath} isn't a directory`);

    const app = new Elysia({
        name: "elysia-autoload",
        seed: {
            pattern,
            dir,
        },
    });

    const glob = new Bun.Glob(pattern || "**/*.{ts,js,mjs,cjs}");

    const files = await Array.fromAsync(
        glob.scan({
            cwd: directoryPath,
        }),
    );

    for await (const path of sortByNestedParams(files)) {
        const file = await import(join(directoryPath, path));

        if (!file.default)
            throw new Error(`${path} don't provide export default`);
        const url = transformToUrl(path);

        const groupOptions = schema ? schema({ path, url }) : {};
        // Типы свойства "body" несовместимы.
        // Тип "string | TSchema | undefined" не может быть назначен для типа "TSchema | undefined".
        // Тип "string" не может быть назначен для типа "TSchema".ts(2345)
        // @ts-expect-error why....
        app.group((prefix ?? "") + url, groupOptions, file.default);
    }

    return app;
}
