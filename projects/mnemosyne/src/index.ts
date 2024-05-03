import fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import fs from "node:fs";
// import { unlink } from "node:fs/promises";
import stream from "node:stream/promises";
import path from "node:path";

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

async function setupRoutes(server: FastifyInstance, files: string[]): Promise<void> {
  server.get("/files", async () => {
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
      files.push(path.join(dir, data.filename));
      return data.filename;
    } catch (err) {
      console.error(err);
    }
  });

  /*
  server.delete("/files/:filename", async (req, rep) => {
    await unlink(path.join(
  });
  */
}

const start = async () => {
  try {
    const server = await initServer();
    if (!fs.existsSync(UPLOADS_DIR)) {
      throw new Error(`directory ${UPLOADS_DIR} does not exist, aborting...`);
    }
    const files: string[] = [];
    for (const dir of ["photos", "videos"]) {
      const fullPath = path.join(UPLOADS_DIR, dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath);
      } else {
        files.push(...fs.readdirSync(fullPath).map((file) => path.join(dir, file)));
      }
    }
    await setupRoutes(server, files);
    await server.listen({ port: PORT });
    console.log(`Server listening on port ${PORT}`);
  } catch (err: unknown) {
    console.error(err instanceof Error ? err.message : "unexpected error");
    process.exit(1);
  }
};

start();
