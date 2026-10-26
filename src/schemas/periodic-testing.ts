import { z } from 'zod';

import { SELECTABLE_TEST_TYPES } from '@/utils/constants';
import { TestTypeUnit } from '@/utils/enum';

export const UpsertTestTypeSchema = z.object({
  name: z.string().min(3).max(64),
  unit: z.enum(SELECTABLE_TEST_TYPES).default(TestTypeUnit.SECONDS),
});

export type UpsertTestTypeSchemaValues = z.infer<typeof UpsertTestTypeSchema>;
