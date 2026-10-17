import { z } from 'zod';

export const UpsertLocationSchema = z.object({
  name: z.string().min(3).max(128),
  address: z.string().min(3).max(256),
});

export type UpsertLocationSchemaValues = z.infer<typeof UpsertLocationSchema>;
