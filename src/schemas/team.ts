import { z } from 'zod';

const MIN_YEAR = 2000;
const CURRENT_YEAR = new Date().getFullYear();

const emptyToUndefined = (value: unknown) => (value === '' ? undefined : value);

export const UpsertTeamSchema = z.object({
  name: z.string().min(3).max(128),
  email: z.preprocess(emptyToUndefined, z.email().max(128).nullish()),
  establish_year: z.coerce
    .number()
    .int()
    .min(MIN_YEAR)
    .max(CURRENT_YEAR)
    .default(CURRENT_YEAR),
});

export type UpsertTeamSchemaValues = z.infer<typeof UpsertTeamSchema>;
