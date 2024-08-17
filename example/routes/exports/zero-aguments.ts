import Elysia from "elysia";

console.log(1333);

export default () => new Elysia().get("/", { hello: "world" });
