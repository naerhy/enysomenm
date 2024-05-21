import express, { type RequestHandler } from "express";
import path from "node:path";
import { unlink } from "node:fs/promises";
import multer from "multer";
import { DataSource } from "typeorm";
import { PhotoEntity } from "../photo.entity";
import { type Env, idSchema, photosPatchSchema } from "../schemas";
import { ExifDateTime, exiftool } from "exiftool-vendored";

const createPhotosRouter = async (env: Env, isAdminMiddleware: RequestHandler) => {
  const dataSource = new DataSource({
    type: "postgres",
    host: "db",
    port: 5432,
    username: env.POSTGRES_USER,
    password: env.POSTGRES_PASSWORD,
    database: env.POSTGRES_DB,
    entities: [PhotoEntity],
    synchronize: true
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
    }),
    fileFilter: async (_req, file, cb) => {
      if (!["image/jpeg", "image/png"].includes(file.mimetype)) {
        return cb(null, false);
      }
      const existingfile = await repository.findOneBy({ name: file.originalname });
      cb(null, existingfile === null);
    }
  });

  const transformPhotoSubjects = (photo: PhotoEntity) => {
    return { ...photo, subjects: photo.subjects === "" ? [] : photo.subjects.split(",") };
  };

  const router = express.Router();

  router.get("/", async (_, res, next) => {
    try {
      const photos = await repository.find();
      res.json(photos.map((photo) => transformPhotoSubjects(photo)));
    } catch (err) {
      next(err);
    }
  });

  router.post("/", isAdminMiddleware, multerInstance.single("file"), async (req, res, next) => {
    try {
      if (!req.file) {
        throw { statusCode: 400, message: "Le fichier n'est pas défini, ou incorrect." };
      }
      const url = path.join("photos", req.file.filename);
      const tags = await exiftool.read(path.join(env.UPLOADS_DIR, url));
      const photo = new PhotoEntity();
      photo.name = req.file.filename;
      photo.timestamp = tags.DateTimeOriginal instanceof ExifDateTime ? tags.DateTimeOriginal.toDate().getTime() : 0;
      photo.url = url;
      photo.source = "";
      photo.subjects = "";
      await repository.save(photo);
      console.log(`Photo ${photo.name} has been saved to database`);
      return res.json(transformPhotoSubjects(photo));
    } catch (err) {
      next(err);
    }
  });

  router.patch("/:id", isAdminMiddleware, async (req, res, next) => {
    try {
      const id = idSchema.parse(parseInt(req.params.id));
      const photo = await repository.findOneBy({ id });
      if (photo === null) {
        throw { statusCode: 400, message: "Ceci n'est pas un identifiant de photo valide." };
      }
      const { newName, newSource, newSubjects } = photosPatchSchema.parse(req.body);
      if (newName !== undefined) {
        if (await repository.findOneBy({ name: newName }) === null) {
          photo.name = newName;
        } else {
          throw { statusCode: 400, message: "Une photo existe déjà avec ce nom." };
        }
      }
      if (newSource !== undefined) {
        if (env.SOURCES.includes(newSource)) {
          photo.source = newSource;
        } else {
          throw { statusCode: 400, message: "La source de la photo n'est pas valide." };
        }
      }
      if (newSubjects !== undefined) {
        if (newSubjects.length === 0 || newSubjects.every((s) => env.SUBJECTS.includes(s))) {
          photo.subjects = newSubjects.length === 0 ? "" : Array.from(new Set(newSubjects)).join(",");
        } else {
          throw { statusCode: 400, message: "Les sujets de la photo ne sont pas valides." };
        }
      }
      await repository.save(photo);
      res.json(transformPhotoSubjects(photo));
    } catch (err) {
      next(err);
    }
  });

  router.delete("/:id", isAdminMiddleware, async (req, res, next) => {
    try {
      const id = idSchema.parse(parseInt(req.params.id));
      const photo = await repository.findOneBy({ id });
      if (photo === null) {
        throw { statusCode: 400, message: "Ceci n'est pas un identifiant de photo valide." };
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
