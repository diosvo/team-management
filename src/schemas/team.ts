import { z } from 'zod';

const MIN_YEAR = 2000;
const CURRENT_YEAR = new Date().getFullYear();

const emptyToUndefined = (value: unknown) => (value === '' ? undefined : value);

export const UpsertTeamSchema = z.object({
  name: z
    .string()
    .min(3, { error: 'Be at least 3 characters long.' })
    .max(128, { error: 'Be at most 128 characters long.' }),
  email: z.preprocess(
    emptyToUndefined,
    z
      .email({ error: 'Enter a valid email address.' })
      .max(128, { error: 'Be at most 128 characters long.' })
      .nullish(),
  ),
  establish_year: z.coerce
    .number()
    .int()
    .min(MIN_YEAR, { error: `Be at least ${MIN_YEAR}.` })
    .max(CURRENT_YEAR, { error: `Be at most ${CURRENT_YEAR}.` })
    .default(CURRENT_YEAR),
  image: z.preprocess(emptyToUndefined, z.string().nullish()),
});

export type UpsertTeamSchemaValues = z.infer<typeof UpsertTeamSchema>;
