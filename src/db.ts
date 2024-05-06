import { DataSource, type Repository } from "typeorm";
import { PhotoEntity } from "./entity";
import fastifyPlugin from "fastify-plugin";
import type { FastifyPluginAsync } from "fastify";

declare module "fastify" {
  interface FastifyInstance {
    photosRepository: Repository<PhotoEntity>;
  }
}

const initDb: FastifyPluginAsync = async (server) => {
  const dataSource = new DataSource({
    type: "sqlite",
    database: "photos.sqlite",
    entities: [PhotoEntity],
    synchronize: true // TODO: remove for production?
  });
  await dataSource.initialize();
  server.decorate("photosRepository", dataSource.getRepository(PhotoEntity));
};

export default fastifyPlugin(initDb);
