import { z } from "zod";

export const envSchema = z.object({
  PORT: z.coerce.number(),
  JWT_SECRET: z.string().min(1),
  PASSWORD_ADMIN: z.string().min(5),
  PASSWORD_USER: z.string().min(5),
  PEOPLE: z.string().transform((value, ctx) => {
    const people = value.replaceAll(" ", "").split(",");
    if (people.length === 0 || people.some((p) => p.length === 0)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "People is either empty or contains invalid names" });
      return z.NEVER;
    }
    return people;
  }),
  UPLOADS_DIR: z.string().min(1)
});

export type Env = z.infer<typeof envSchema>;

export const authPostSchema = z.object({
  password: z.string()
});

export const idSchema = z.number();

export const photosPatchSchema = z.object({
  newPeople: z.array(z.string())
});
