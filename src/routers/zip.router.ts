import express from "express"
import { zipPostSchema } from "../schemas";
import archiver from "archiver";
import fs from "node:fs";
import path from "node:path";
import { Resend } from "resend";

import type { Env } from "../schemas";

const createZipRouter = (env: Env) => {
  const router = express.Router();

  const resend = new Resend(env.RESEND_API_KEY);

  const sendMail = async (email: string, html: string) => {
    const { error } = await resend.emails.send({
      from: "send@naerhy.ovh",
      to: email,
      subject: "Mariage MQ: lien de téléchargement",
      html
    });
    if (error) {
      console.error("Error while trying to send an email", error);
    }
  };

  const createZip = async (email: string, filename: string, filenames: string[]) => {
    const fullPath = path.join(env.UPLOADS_DIR, "zips", filename);
    const output = fs.createWriteStream(fullPath);
    const archive = archiver("zip", { zlib: { level: 9 } });
    let error: Error | null = null;
    output.on("close", async () => {
      if (error) {
        fs.unlink(fullPath, (err) => {
          if (err) {
            console.error(`Cannot delete ${fullPath}, please delete manually`);
          }
        });
        sendMail(email, `<p>Une erreur est survenue lors de la création de votre fichier ${filename}, réessayer ultérieurement ou contactez l'administrateur.</p>`);
      } else {
        sendMail(email, `<p>Votre lien de telechargement pour le fichier ${filename} est prêt, cliquez sur <a href="https://naerhy.ovh/static/mnemosyne/zips/${filename}">ce lien</a> pour le télécharger.</p>`);
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
  };

  router.post("/", async (req, res, next) => {
    try {
      const { email, filenames } = zipPostSchema.parse(req.body);
      // https://stackoverflow.com/questions/1349404/generate-random-string-characters-in-javascript
      const filename = (Math.random() + 1).toString(36).substring(7) + ".zip";
      res.json({ name: filename });
      createZip(email, filename, filenames);
    } catch (err: unknown) {
      next(err);
    }
  });

  return router;
};

export default createZipRouter;
