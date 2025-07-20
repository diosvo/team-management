import { SELECTABLE_TEST_TYPES } from '@/utils/constant';
import { TestTypeUnit } from '@/utils/enum';
import { z } from 'zod';

export const UpsertTestTypeSchema = z.object({
  name: z.string().min(0).max(64).default(''),
  unit: z.enum(SELECTABLE_TEST_TYPES).default(TestTypeUnit.SECONDS),
});

export type UpsertTestTypeSchemaValues = z.infer<typeof UpsertTestTypeSchema>;
