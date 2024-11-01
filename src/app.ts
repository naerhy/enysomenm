import express from "express";
import cors from "cors";
import fs from "node:fs";
import path from "node:path";
import createPhotosRouter from "./routers/photos.router";
import createAuthRouter from "./routers/auth.router";
import createZipRouter from "./routers/zip.router";
import createMiddlewares from "./middlewares";
import { Env } from "./schemas";

class App {
  private readonly env: Env;
  private app: express.Application;

  constructor(env: Env) {
    this.env = env;
    this.createDirectories();
    this.app = express();
    this.app.use(express.json());
    this.app.use(cors());
  }

  public async init(): Promise<void> {
    const middlewares = createMiddlewares(this.env.JWT_SECRET);
    const authRouter = createAuthRouter(this.env);
    const photosRouter = await createPhotosRouter(this.env, middlewares.isAdminMiddleware);
    const zipRouter = createZipRouter(this.env);
    this.app.use("/auth", authRouter);
    this.app.use("/photos", middlewares.authMiddleware, photosRouter);
    this.app.use("/zip", middlewares.authMiddleware, zipRouter);
    this.app.use(middlewares.errorMiddleware);
  }

  private createDirectories(): void {
    if (!fs.existsSync(this.env.UPLOADS_DIR)) {
      throw new Error(`Directory ${this.env.UPLOADS_DIR} does not exist`);
    }
    for (const dir of ["photos", "compressed", "thumbnails", "zips"]) {
      const fullPath = path.join(this.env.UPLOADS_DIR, dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath);
      }
    }
  }

  public start(): void {
    this.app.listen(this.env.PORT, () => {
      console.log(`Server is running on http://localhost:${this.env.PORT}...`);
    });
  }
}

export default App;
