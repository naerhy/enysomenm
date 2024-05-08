import "reflect-metadata";
import App from "./app";

const start = async () => {
  try {
    const app = new App(3000, "static");
    await app.init();
    app.start();
  } catch (err: unknown) {
    console.error(err);
    process.exit(1);
  }
};

start();
