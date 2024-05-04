import "reflect-metadata";
import fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import fs from "node:fs";
import { unlink } from "node:fs/promises";
import stream from "node:stream/promises";
import path from "node:path";
import { DataSource } from "typeorm";
import { FileEntity } from "./entity";

const validMimeTypes = ["image/jpeg", "image/png", "video/mp4"];

const PORT = 3000;
const UPLOADS_DIR = "static";
const MAX_SIZE = 209715200;

async function initServer(): Promise<FastifyInstance> {
  const server = fastify({ bodyLimit: MAX_SIZE });
  await server.register(cors);
  server.register(multipart, {
    limits: {
      fileSize: MAX_SIZE
    }
  });
  return server;
}

async function setupRoutes(server: FastifyInstance, dataSource: DataSource): Promise<void> {
  server.get("/files", async () => {
    const files = await dataSource.manager.find(FileEntity);
    return files;
  });

  server.post("/files", async (req) => {
    try {
      const data = await req.file();
      // TODO: validate file + mimetype + ...
      if (!data || !validMimeTypes.includes(data.mimetype)) {
        throw new Error("Invalid mimetype");
      }
      const dir = data.mimetype.includes("image") ? "photos" : "videos";
      await stream.pipeline(
        data.file,
        fs.createWriteStream(path.join(UPLOADS_DIR, dir, data.filename))
      );
      const file = new FileEntity();
      file.name = data.filename;
      file.url = path.join(dir, data.filename);
      file.people = "";
      await dataSource.manager.save(file);
      console.log("New media has been saved to database");
      return data.filename;
    } catch (err) {
      console.error(err);
    }
  });

  server.delete("/files/:id", async (req) => {
    // @ts-ignore
    const file = await dataSource.manager.findOneBy(FileEntity, { id: req.params.id });
    if (file === null) {
      throw new Error("file doesn't exist");
    }
    await dataSource.manager.remove(file);
    await unlink(path.join(UPLOADS_DIR, file.url));
  });
}

const start = async () => {
  try {
    const dataSource = new DataSource({
      type: "sqlite",
      database: "files.db",
      entities: [FileEntity],
      synchronize: true // TODO: remove for production?
    });
    await dataSource.initialize();
    const server = await initServer();
    if (!fs.existsSync(UPLOADS_DIR)) {
      throw new Error(`directory ${UPLOADS_DIR} does not exist, aborting...`);
    }
    for (const dir of ["photos", "videos"]) {
      const fullPath = path.join(UPLOADS_DIR, dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath);
      }
    }
    await setupRoutes(server, dataSource);
    await server.listen({ port: PORT });
    console.log(`Server listening on port ${PORT}`);
  } catch (err: unknown) {
    console.error(err instanceof Error ? err.message : "unexpected error");
    process.exit(1);
  }
};

start();
