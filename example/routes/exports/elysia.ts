import Elysia from "elysia";

export default new Elysia().get("", { hello: "world" });
