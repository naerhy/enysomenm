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
      const { filenames } = zipPostSchema.parse(req.body);
      // https://stackoverflow.com/questions/1349404/generate-random-string-characters-in-javascript
      const filename = (Math.random() + 1).toString(36).substring(7) + ".zip";
      const fullPath = path.join(env.UPLOADS_DIR, "zips", filename);
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
          res.json({ name: filename });
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
