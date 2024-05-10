import express, { type RequestHandler } from "express";
import path from "node:path";
import { unlink } from "node:fs/promises";
import multer from "multer";
import { DataSource } from "typeorm";
import { PhotoEntity } from "../photo.entity";
import { type Env, idSchema, photosPatchSchema } from "../schemas";

const transformPhoto = (photo: PhotoEntity) => {
  return { ...photo, people: photo.people === "" ? [] : photo.people.split(",") };
};

const createPhotosRouter = async (env: Env, isAdminMiddleware: RequestHandler) => {
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
        cb(null, path.join(env.UPLOADS_DIR, "photos"));
      },
      filename: function (_req, file, cb) {
        cb(null, file.originalname);
      }
    })
  });

  const router = express.Router();

  router.get("/", async (_, res, next) => {
    try {
      const photos = await repository.find();
      res.json(photos.map((photo) => transformPhoto(photo)));
    } catch (err) {
      next(err);
    }
  });

  router.post("/", isAdminMiddleware, multerInstance.single("file"), async (req, res, next) => {
    try {
      if (!req.file) {
        throw { statusCode: 400, message: "File is undefined" };
      }
      const photo = new PhotoEntity();
      photo.name = req.file.filename;
      photo.url = path.join("photos", photo.name);
      photo.people = "";
      await repository.save(photo);
      console.log(`Photo ${photo.name} has been saved to database`);
      return res.json(transformPhoto(photo));
    } catch (err) {
      next(err);
    }
  });

  router.patch("/:id", isAdminMiddleware, async (req, res, next) => {
    try {
      const id = idSchema.parse(parseInt(req.params.id));
      const photo = await repository.findOneBy({ id });
      if (photo === null) {
        throw { statusCode: 400, message: "Not a valid photo id" };
      }
      const { newPeople } = photosPatchSchema.parse(req.body);
      if (newPeople.length === 0 || newPeople.every((p) => env.PEOPLE.includes(p))) {
        photo.people = newPeople.length === 0 ? "" : Array.from(new Set(newPeople)).join(",");
        await repository.save(photo);
        res.json(transformPhoto(photo));
      } else {
        throw { statusCode: 400, message: "People names are invalid" };
      }
    } catch (err) {
      next(err);
    }
  });

  router.delete("/:id", isAdminMiddleware, async (req, res, next) => {
    try {
      const id = idSchema.parse(parseInt(req.params.id));
      const photo = await repository.findOneBy({ id });
      if (photo === null) {
        throw { statusCode: 400, message: "Not a valid photo id" };
      }
      await repository.remove(photo);
      await unlink(path.join(env.UPLOADS_DIR, photo.url));
      res.json(photo);
    } catch (err) {
      next(err);
    }
  });

  return router;
};

export default createPhotosRouter;
