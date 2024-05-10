import type { ErrorRequestHandler, RequestHandler } from "express";
import jwt from "jsonwebtoken";

const createMiddlewares = (jwtSecret: string) => {
  const authMiddleware: RequestHandler = (req, _res, next) => {
    const token = req.headers["authorization"]?.split(" ")[1];
    if (token === undefined) {
      next({ statusCode: 401, message: "Authorization header is undefined" });
    } else {
      jwt.verify(token, jwtSecret, (err, decodedToken) => {
        if (err !== null) {
          next({ statusCode: 401, message: "JWT is not valid" });
        } else {
          // @ts-ignore
          req.token = decodedToken;
          next();
        }
      });
    }
  };

  const isAdminMiddleware: RequestHandler = (req, _res, next) => {
    // @ts-ignore
    if (req.token.role === "user") {
      next({ statusCode: 403, message: "You don't have the permission" });
    } else {
      next();
    }
  };

  const errorMiddleware: ErrorRequestHandler = (err, _req, res, _next) => {
    const errObj = {
      statusCode: err.statusCode || 500,
      message: err.message || "Internal server error"
    };
    res.status(errObj.statusCode).json(errObj);
  };

  return { authMiddleware, isAdminMiddleware, errorMiddleware };
};

export default createMiddlewares;
