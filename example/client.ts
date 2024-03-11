import { edenTreaty } from "@elysiajs/eden";

const app = edenTreaty<Routes>("http://localhost:3002");

const { data } = await app.api.test["some-path-param"].get({
	$query: {
		key: 2,
	},
});

console.log(data);
