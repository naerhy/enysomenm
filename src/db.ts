import { DataSource } from "typeorm";
import { FileEntity } from "./entity";
import fastifyPlugin from "fastify-plugin";
import type { FastifyPluginAsync } from "fastify";

declare module "fastify" {
  interface FastifyInstance {
    dataSource: DataSource;
  }
}

const initDb: FastifyPluginAsync = async (server) => {
  const dataSource = new DataSource({
    type: "sqlite",
    database: "files.db",
    entities: [FileEntity],
    synchronize: true // TODO: remove for production?
  });
  await dataSource.initialize();
  server.decorate("dataSource", dataSource);
};

export default fastifyPlugin(initDb);
