import { autoload } from "esbuild-plugin-autoload";

await Bun.build({
	entrypoints: ["index.ts"],
	outdir: "out",
	plugins: [
		autoload({
			directory: "./routes",
		}),
	],
}).then(console.log);

await Bun.$`bun build --compile out/index.js`;
