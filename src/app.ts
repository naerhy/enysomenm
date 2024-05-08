import express from "express";
import cors from "cors";
import fs from "node:fs";
import path from "node:path";
import createPhotosRouter from "./routers/photos.router";

class App {
  private readonly port: number;
  private readonly uploadsDir: string;
  private app: express.Application;

  constructor(port: number, uploadsDir: string) {
    this.port = port;
    this.uploadsDir = uploadsDir;
    this.createDirectories();
    this.app = express();
    this.app.use(express.json());
    this.app.use(cors());
  }

  public async init(): Promise<void> {
    const photosRouter = await createPhotosRouter(this.uploadsDir);
    this.app.use("/photos", photosRouter);
  }

  private createDirectories(): void {
    if (!fs.existsSync(this.uploadsDir)) {
      throw new Error(`directory ${this.uploadsDir} does not exist, aborting...`);
    }
    const fullPath = path.join(this.uploadsDir, "photos");
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath);
    }
  }

  start(): void {
    this.app.listen(this.port, () => {
      console.log(`Server is running on http://localhost:${this.port}`);
    });
  }
}

export default App;
