import { z } from "zod";
import { ZActionClassAutomaticInput } from "./actionClasses";
import { ZAttributeClassAutomaticInput } from "./attributeClasses";

export const ZEnvironment = z.object({
  id: z.string().cuid2(),
  createdAt: z.date(),
  updatedAt: z.date(),
  type: z.enum(["development", "production"]),
  productId: z.string(),
  widgetSetupCompleted: z.boolean(),
});

export type TEnvironment = z.infer<typeof ZEnvironment>;

export const ZEnvironmentId = z.object({
  id: z.string(),
});

export type TEnvironmentId = z.infer<typeof ZEnvironmentId>;

export const ZEnvironmentUpdateInput = z.object({
  type: z.enum(["development", "production"]),
  productId: z.string(),
  widgetSetupCompleted: z.boolean(),
});

export const ZId = z.string().cuid2();

export const ZEnvironmentCreateInput = z.object({
  type: z.enum(["development", "production"]),
  productId: z.string(),
  widgetSetupCompleted: z.boolean(),
  eventClasses: z.array(ZActionClassAutomaticInput),
  attributeClasses: z.array(ZAttributeClassAutomaticInput),
});

export type TEnvironmentCreateInput = z.infer<typeof ZEnvironmentCreateInput>;

export type TEnvironmentUpdateInput = z.infer<typeof ZEnvironmentUpdateInput>;
