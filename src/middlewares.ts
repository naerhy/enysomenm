import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";

const authMiddleware: RequestHandler = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (token === undefined) {
    res.status(400).json({ statusCode: 400, message: "message" });
  } else {
    jwt.verify(token, "secret", (err, decodedToken) => {
      if (err !== null) {
        res.status(400).json({ statusCode: 400, message: "message" });
      } else {
        // @ts-ignore
        req.token = decodedToken;
        next();
      }
    });
  }
};

const isAdminMiddleware: RequestHandler = (req, res, next) => {
  // @ts-ignore
  if (req.token.role === "user") {
    res.status(400).json({ statusCode: 400, message: "message" });
  } else {
    next();
  }
};

export { authMiddleware, isAdminMiddleware };
