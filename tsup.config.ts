import { defineConfig } from "tsup";

export default defineConfig({
	entry: ["src/index.ts"],
	format: ["esm", "cjs"],
	
	target: "node20",
	outDir: "dist",
	dts: true,
	minify: false
});
