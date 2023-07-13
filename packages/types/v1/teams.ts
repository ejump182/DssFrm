import { z } from "zod";

export const ZTeam = z.object({
  id: z.string().cuid2(),
  createdAt: z.date(),
  updatedAt: z.date(),
  name: z.string(),
  plan: z.enum(["free", "pro"]),
});

export type TTeam = z.infer<typeof ZTeam>;
