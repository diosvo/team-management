import { z } from 'zod';

export const UpsertLocationSchema = z.object({
  name: z
    .string()
    .min(3, { error: 'Be at least 3 characters long.' })
    .max(128, { error: 'Be at most 128 characters long.' }),
  address: z
    .string()
    .min(3, { error: 'Be at least 3 characters long.' })
    .max(256, { error: 'Be at most 256 characters long.' }),
});

export type UpsertLocationSchemaValues = z.infer<typeof UpsertLocationSchema>;
