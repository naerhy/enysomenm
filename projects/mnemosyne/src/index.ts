import fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import fs from "node:fs";
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

async function setupRoutes(server: FastifyInstance): Promise<void> {
  server.post("/files", async (req) => {
    try {
      const data = await req.file();
      // TODO: validate file + mimetype + ...
      if (!data || !isValidMimeType(data.mimetype)) {
        throw new Error("Invalid mimetype");
      }
      await stream.pipeline(
        data.file,
        fs.createWriteStream(
          path.join(UPLOADS_DIR, data.mimetype.includes("image") ? "photos" : "videos", data.filename)
        )
      );
      return data.filename;
    } catch (err) {
      console.error(err);
    }
  });
}

function isValidMimeType(mimetype: string): boolean {
  for (const v of validMimeTypes) {
    if (mimetype === v) {
      return true;
    }
  }
  return false;
}

const start = async () => {
  try {
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
    await setupRoutes(server);
    await server.listen({ port: PORT });
    console.log(`Server listening on port ${PORT}`);
  } catch (err: unknown) {
    console.error(err instanceof Error ? err.message : "unexpected error");
    process.exit(1);
  }
};

start();
