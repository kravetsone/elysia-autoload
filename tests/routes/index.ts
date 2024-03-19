// routes/index.ts

import type { ElysiaApp } from "../index.test";

export default (app: ElysiaApp) => app.get("/", { hello: "world" });
