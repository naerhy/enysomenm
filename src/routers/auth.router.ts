import express from "express";
import jwt from "jsonwebtoken";
import { type Env, authPostSchema } from "../schemas";

const createAuthRouter = (env: Env) => {
  const router = express.Router();

  router.post("/", (req, res, next) => {
    try {
      const { password } = authPostSchema.parse(req.body);
      if (![env.PASSWORD_ADMIN, env.PASSWORD_USER].includes(password)) {
        throw { statusCode: 400, message: "Password is not valid" };
      }
      const role = password === env.PASSWORD_ADMIN ? "admin" : "user";
      jwt.sign({ sub: role }, env.JWT_SECRET, { expiresIn: 7200 }, (err, encodedToken) => {
        if (err !== null) {
          next();
        } else {
          res.json({ role, token: encodedToken });
        }
      });
    } catch (err: unknown) {
      next(err);
    }
  });

  return router;
};

export default createAuthRouter;
