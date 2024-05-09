import "reflect-metadata";
import "dotenv/config";
import App from "./app";
import { envSchema } from "./schemas";

const start = async () => {
  try {
    const env = envSchema.parse(process.env);
    const app = new App(env);
    await app.init();
    app.start();
  } catch (err: unknown) {
    console.error(err);
    process.exit(1);
  }
};

start();
