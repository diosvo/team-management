import { z } from 'zod';

import { SELECTABLE_TEST_TYPES } from '@/utils/constant';
import { TestTypeUnit } from '@/utils/enum';

export const UpsertTestTypeSchema = z.object({
  name: z
    .string()
    .min(3, {
      message: 'Be at least 3 characters long.',
    })
    .max(64, {
      error: 'Be at most 64 characters long.',
    }),
  unit: z.enum(SELECTABLE_TEST_TYPES).default(TestTypeUnit.SECONDS),
});

export type UpsertTestTypeSchemaValues = z.infer<typeof UpsertTestTypeSchema>;
