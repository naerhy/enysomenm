import { z } from "zod";

export const envSchema = z.object({
  PORT: z.coerce.number(),
  JWT_SECRET: z.string(),
  PASSWORD_ADMIN: z.string(),
  PASSWORD_USER: z.string(),
  UPLOADS_DIR: z.string()
});

export type Env = z.infer<typeof envSchema>;

export const authPostSchema = z.object({
  password: z.string()
});

export const idSchema = z.number();

export const photosPatchSchema = z.object({
  newPeople: z.array(z.string())
});
