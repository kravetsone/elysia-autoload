// routes/index.ts
import type { ElysiaApp } from "../index";

export default (app: ElysiaApp) => app.get("", { hello: "world" });
