import { z } from "zod";

export const envSchema = z.object({
  PORT: z.coerce.number(),
  JWT_SECRET: z.string().min(1),
  UPLOADS_DIR: z.string().min(1),
  PASSWORD_ADMIN: z.string().min(5),
  PASSWORD_USER: z.string().min(5),
  SOURCES: z.string().transform((sources, ctx) => {
    const arraySources = sources.split(",");
    if (arraySources.length === 0 || arraySources.some((s) => s.length === 0)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Sources from .env are invalid" });
      return z.NEVER;
    }
    return arraySources;
  }),
  SUBJECTS: z.string().transform((subjects, ctx) => {
    const arraySubjects = subjects.split(",");
    if (arraySubjects.length === 0 || arraySubjects.some((s) => s.length === 0)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Subjects from .env are invalid" });
      return z.NEVER;
    }
    return arraySubjects;
  }),
  POSTGRES_USER: z.string().min(1),
  POSTGRES_PASSWORD: z.string().min(5),
  POSTGRES_DB: z.string().min(2),
  RESEND_API_KEY: z.string().min(1)
});

export type Env = z.infer<typeof envSchema>;

export const authPostSchema = z.object({
  password: z.string()
});

export const idSchema = z.number();

export const photosPatchSchema = z.object({
  newName: z.optional(z.string()),
  newSource: z.optional(z.string()),
  newSubjects: z.optional(z.array(z.string()))
});

export const zipPostSchema = z.object({
  email: z.string().email(),
  filenames: z.array(z.string())
});
