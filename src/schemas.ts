import { z } from "zod";

export const idSchema = z.number();

export const photosPatchSchema = z.object({
  newPeople: z.array(z.string())
});
