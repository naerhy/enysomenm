import express from "express";
import jwt from "jsonwebtoken";
import { authPostSchema } from "../schemas";

const createAuthRouter = (secret: string, expiration: number, adminPassword: string, userPassword: string) => {
  const router = express.Router();

  router.post("/", (req, res) => {
    // TODO: make this async?
    try {
      const { password } = authPostSchema.parse(req.body);
      if (![adminPassword, userPassword].includes(password)) {
        throw new Error("Password is incorrect");
      }
      jwt.sign(
        {
          role: password === adminPassword ? "admin" : "user"
        },
        secret,
        {
          expiresIn: expiration
        },
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
