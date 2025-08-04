import { z } from 'zod';

import { SELECTABLE_TEST_TYPES } from '@/utils/constant';
import { TestTypeUnit } from '@/utils/enum';

export const UpsertTestTypeSchema = z.object({
  name: z.string().max(64).default(''),
  unit: z.enum(SELECTABLE_TEST_TYPES).default(TestTypeUnit.SECONDS),
});

export type UpsertTestTypeSchemaValues = z.infer<typeof UpsertTestTypeSchema>;
