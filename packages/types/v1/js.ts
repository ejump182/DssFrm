import z from "zod";
import { ZPerson } from "./people";
import { ZSession } from "./sessions";
import { ZSurvey } from "./surveys";
import { ZActionClass } from "./actionClasses";
import { ZProduct } from "./product";

export const ZJsState = z.object({
  person: ZPerson,
  session: ZSession,
  surveys: z.array(ZSurvey),
  noCodeActionClasses: z.array(ZActionClass),
  product: ZProduct,
});

export type TJsState = z.infer<typeof ZJsState>;

export const ZJsSyncInput = z.object({
  environmentId: z.string().cuid2(),
  personId: z.string().cuid2().optional(),
  sessionId: z.string().cuid2().optional(),
});

export type TJsSyncInput = z.infer<typeof ZJsSyncInput>;
