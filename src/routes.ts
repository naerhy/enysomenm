import { PhotoEntity } from "./entity";
import stream from "node:stream/promises";
import path from "node:path";
import fs from "node:fs";
import { unlink } from "node:fs/promises";
import { UPLOADS_DIR } from "./constants";
import { Type } from "@sinclair/typebox";
import { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";

const validMimeTypes = ["image/jpeg", "image/png"];

const routes: FastifyPluginAsyncTypebox = async (server) => {
  server.get("/", async () => {
    const photos = await server.photosRepository.find();
    return photos;
  });

  server.post("/", async (req) => {
    try {
      const data = await req.file();
      // TODO: validate file + mimetype + ...
      if (!data || !validMimeTypes.includes(data.mimetype)) {
        throw new Error("Invalid mimetype.");
      }
      await stream.pipeline(
        data.file,
        fs.createWriteStream(path.join(UPLOADS_DIR, "photos", data.filename))
      );
      const photo = new PhotoEntity();
      photo.name = data.filename;
      photo.url = path.join("photos", data.filename);
      photo.people = "";
      await server.photosRepository.save(photo);
      console.log(`Photo ${photo.name} has been saved to database!`);
      return photo;
    } catch (err: unknown) {
      console.error(err);
    }
  });

  server.patch("/:id", {
    schema: {
      params: Type.Object({ id: Type.Number() }),
      body: Type.Object({ newPeople: Type.Array(Type.String()) })
    }
  }, async (req) => {
    const photo = await server.photosRepository.findOneBy({ id: req.params.id });
    if (photo === null) {
      throw new Error("Photo doesn't exist.");
    }
    if (req.body.newPeople.length === 0) {
      photo.people = "";
    } else {
      photo.people = req.body.newPeople.join(",");
    }
    await server.photosRepository.save(photo);
    return photo;
  });

  server.delete("/:id", {
    schema: {
      params: Type.Object({ id: Type.Number() })
    }
  }, async (req) => {
    const photo = await server.photosRepository.findOneBy({ id: req.params.id });
    if (photo === null) {
      throw new Error("file doesn't exist");
    }
    await server.photosRepository.remove(photo);
    await unlink(path.join(UPLOADS_DIR, photo.url));
  });
};

export default routes;
