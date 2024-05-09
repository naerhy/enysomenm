import { z } from "zod";

export const authPostSchema = z.object({
  password: z.string()
});

export const idSchema = z.number();

export const photosPatchSchema = z.object({
  newPeople: z.array(z.string())
});
