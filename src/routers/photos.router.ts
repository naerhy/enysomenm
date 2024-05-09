import express from "express";
import path from "node:path";
import { unlink } from "node:fs/promises";
import multer from "multer";
import { DataSource } from "typeorm";
import { PhotoEntity } from "../photo.entity";
import { idSchema, photosPatchSchema } from "../schemas";
import { isAdminMiddleware } from "../middlewares";

const createPhotosRouter = async (uploadsDir: string) => {
  const dataSource = new DataSource({
    type: "sqlite",
    database: "photos.sqlite",
    entities: [PhotoEntity],
    synchronize: true // TODO: remove in production?
  });
  await dataSource.initialize();
  const repository = dataSource.getRepository(PhotoEntity);

  const multerInstance = multer({
    storage: multer.diskStorage({
      destination: function (_req, _file, cb) {
        cb(null, path.join(uploadsDir, "photos"));
      },
      filename: function (_req, file, cb) {
        console.dir(file);
        cb(null, file.originalname);
      }
    })
  });

  const router = express.Router();

  router.get("/", async (_, res) => {
    try {
      const photos = await repository.find();
      res.json(photos);
    } catch (err) {
      res.status(400).json({ statusCode: 400, message: "message" });
    }
  });

  router.post("/", isAdminMiddleware, multerInstance.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        throw new Error("File is undefined");
      }
      const photo = new PhotoEntity();
      photo.name = req.file.filename;
      photo.url = path.join("photos", photo.name);
      photo.people = "";
      await repository.save(photo);
      console.log(`Photo ${photo.name} has been saved to database`);
      return res.json(photo);
    } catch (err) {
      res.status(400).json({ statusCode: 400, message: "message" });
    }
  });

  router.patch("/:id", isAdminMiddleware, async (req, res) => {
    try {
      const id = idSchema.parse(parseInt(req.params.id));
      const photo = await repository.findOneBy({ id });
      if (photo === null) {
        throw new Error("Id does not exist in database");
      }
      const { newPeople } = photosPatchSchema.parse(req.body);
      photo.people = newPeople.length === 0 ? "" : newPeople.join(",");
      await repository.save(photo);
      res.json(photo);
    } catch (err: unknown) {
      res.status(400).json({ statusCode: 400, message: "message" });
    }
  });

  router.delete("/:id", isAdminMiddleware, async (req, res) => {
    try {
      const id = idSchema.parse(parseInt(req.params.id));
      const photo = await repository.findOneBy({ id });
      if (photo === null) {
        throw new Error("Id does not exist in database");
      }
      await repository.remove(photo);
      await unlink(path.join(uploadsDir, photo.url));
      res.json(photo);
    } catch (err) {
      res.status(400).json({ statusCode: 400, message: "message" });
    }
  });

  return router;
};

export default createPhotosRouter;
