import { treaty } from "@elysiajs/eden";

const app = treaty<Routes>("http://localhost:3002");

const { data } = await app.api.test({ some: 1 }).test.get({
	query: {
		key: 2,
	},
});

console.log(data);
