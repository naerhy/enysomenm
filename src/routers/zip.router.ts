import express from "express"
import { zipPostSchema } from "../schemas";
import archiver from "archiver";
import fs from "node:fs";
import path from "node:path";

import type { Env } from "../schemas";

const createZipRouter = (env: Env) => {
  const router = express.Router();

  router.post("/", async (req, res, next) => {
    try {
      const { filenames, name } = zipPostSchema.parse(req.body);
      const fullPath = path.join(env.UPLOADS_DIR, "zips", `${name}.zip`);
      const output = fs.createWriteStream(fullPath);
      const archive = archiver("zip", { zlib: { level: 9 } });
      let error: Error | null = null;
      output.on("close", () => {
        if (error) {
          fs.unlink(fullPath, (err) => {
            if (err) {
              console.error(`Cannot delete ${fullPath}, please delete manually`);
            }
          });
          next(error);
        } else {
          res.json({ name: `${name}.zip` });
        }
      });
      archive.on("error", (err) => {
        error = err;
      });
      archive.on("warning", (err) => {
        error = err;
      });
      archive.pipe(output);
      for (const filename of filenames) {
        archive.file(path.join(env.UPLOADS_DIR, "photos", filename), { name: filename });
      }
      await archive.finalize();
    } catch (err: unknown) {
      next(err);
    }
  });

  return router;
};

export default createZipRouter;
