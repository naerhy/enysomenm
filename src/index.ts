import "reflect-metadata";
import fastify from "fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import fs from "node:fs";
import path from "node:path";
import initDb from "./db";
import routes from "./routes";
import { MAX_SIZE, PORT, UPLOADS_DIR } from "./constants";

const start = async () => {
  try {
    if (!fs.existsSync(UPLOADS_DIR)) {
      throw new Error(`directory ${UPLOADS_DIR} does not exist, aborting...`);
    }
    for (const dir of ["photos", "videos"]) {
      const fullPath = path.join(UPLOADS_DIR, dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath);
      }
    }
    const server = fastify({ bodyLimit: MAX_SIZE });
    server.register(cors);
    server.register(multipart, { limits: { fileSize: MAX_SIZE } });
    server.register(initDb);
    server.register(routes);
    // await setupRoutes(server);
    await server.listen({ port: PORT });
    console.log(`Server listening on port ${PORT}`);
  } catch (err: unknown) {
    console.error(err instanceof Error ? err.message : "unexpected error");
    process.exit(1);
  }
};

start();
