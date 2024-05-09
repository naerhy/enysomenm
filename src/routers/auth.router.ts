import express from "express";
import jwt from "jsonwebtoken";
import { type Env, authPostSchema } from "../schemas";

const createAuthRouter = (env: Env) => {
  const router = express.Router();

  router.post("/", (req, res) => {
    try {
      const { password } = authPostSchema.parse(req.body);
      if (![env.PASSWORD_ADMIN, env.PASSWORD_USER].includes(password)) {
        throw new Error("Password is incorrect");
      }
      jwt.sign(
        { role: password === env.PASSWORD_ADMIN ? "admin" : "user" },
        env.JWT_SECRET,
        { expiresIn: 7200 },
        (err, encodedToken) => {
          if (err !== null) {
            res.status(400).json({ statusCode: 400, message: "message" });
          } else {
            res.json({ token: encodedToken });
          }
        }
      );
    } catch (err: unknown) {
      res.status(400).json({ statusCode: 400, message: "message" });
    }
  });

  return router;
};

export default createAuthRouter;
