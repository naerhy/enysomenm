import type { ErrorRequestHandler, RequestHandler } from "express";
import jwt from "jsonwebtoken";

const createMiddlewares = (jwtSecret: string) => {
  const authMiddleware: RequestHandler = (req, _res, next) => {
    const token = req.headers["authorization"]?.split(" ")[1];
    if (token === undefined) {
      next({ statusCode: 401, message: "L'en-tête d'autorisation n'est pas définie." });
    } else {
      jwt.verify(token, jwtSecret, (err, decodedToken) => {
        if (err !== null) {
          next({ statusCode: 401, message: "Le jeton d'authentification est incorrect.." });
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
      next({ statusCode: 403, message: "Vous n'avez pas les permissions nécessaires." });
    } else {
      next();
    }
  };

  const errorMiddleware: ErrorRequestHandler = (err, _req, res, _next) => {
    const errObj = {
      statusCode: err.statusCode || 500,
      message: err.message || "Erreur de serveur interne."
    };
    res.status(errObj.statusCode).json(errObj);
  };

  return { authMiddleware, isAdminMiddleware, errorMiddleware };
};

export default createMiddlewares;
