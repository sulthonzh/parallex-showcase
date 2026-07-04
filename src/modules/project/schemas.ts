import { z } from "zod";

export const createProjectSchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().max(2000).optional(),
  location: z.string().max(200).optional(),
  heroImageUrl: z.string().url().optional().or(z.literal("")),
});

export const updateProjectSchema = createProjectSchema.partial().extend({
  status: z.enum(["draft", "published"]).optional(),
});

export const createAssetSchema = z.object({
  projectId: z.string().uuid(),
  type: z
    .enum(["render", "film", "floorplan", "brochure", "gallery"])
    .default("gallery"),
  title: z.string().min(2).max(200),
  url: z.string().url(),
  thumbnailUrl: z.string().url().optional().or(z.literal("")),
  description: z.string().max(1000).optional(),
});

export const createUnitSchema = z.object({
  projectId: z.string().uuid(),
  code: z.string().min(1).max(50),
  name: z.string().max(200).optional(),
  beds: z.coerce.number().int().min(0).optional(),
  baths: z.coerce.number().int().min(0).optional(),
  areaSqft: z.coerce.number().int().min(0).optional(),
  price: z.coerce.number().int().min(0).optional(),
  floorNumber: z.coerce.number().int().min(0).optional(),
});
