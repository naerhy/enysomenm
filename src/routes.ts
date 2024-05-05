import type { FastifyPluginAsync } from "fastify";
import { FileEntity } from "./entity";
import stream from "node:stream/promises";
import path from "node:path";
import fs from "node:fs";
import { unlink } from "node:fs/promises";
import { UPLOADS_DIR } from "./constants";

const validMimeTypes = ["image/jpeg", "image/png", "video/mp4"];

const routes: FastifyPluginAsync = async (server) => {
  server.get("/files", async () => {
    const files = await server.dataSource.manager.find(FileEntity);
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
      await server.dataSource.manager.save(file);
      console.log("New media has been saved to database");
      return data.filename;
    } catch (err) {
      console.error(err);
    }
  });

  server.delete<{ Params: { id: number } }>("/files/:id", async (req) => {
    const file = await server.dataSource.manager.findOneBy(FileEntity, { id: req.params.id });
    if (file === null) {
      throw new Error("file doesn't exist");
    }
    await server.dataSource.manager.remove(file);
    await unlink(path.join(UPLOADS_DIR, file.url));
  });
};

export default routes;
