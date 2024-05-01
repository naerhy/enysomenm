import fastify from "fastify";

const server = fastify();

const start = async () => {
	try {
		await server.listen({ port: 3000 });
		console.log("Server started");
	} catch (err) {
		console.error(err);
		process.exit(1);
	}
};

start();
