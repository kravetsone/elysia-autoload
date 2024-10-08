// routes/test/[some]/index.ts
import { t } from "elysia";
import type { ElysiaApp } from "../../../index";

export default (app: ElysiaApp) =>
	app.get(
		"",
		{ hello: "world" },
		{
			query: t.Object({
				key: t.Numeric(),
			}),
			params: t.Object({
				some: t.String(),
			}),
		},
	);
