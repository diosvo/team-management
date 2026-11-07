import { z } from 'zod';

import { SELECTABLE_TEST_TYPES } from '@/utils/constants';
import { TestTypeUnit } from '@/utils/enum';

export const UpsertTestTypeSchema = z.object({
  name: z.string().min(3).max(64),
  unit: z.enum(SELECTABLE_TEST_TYPES).default(TestTypeUnit.TIMES),
  direction: z.enum(['higher', 'lower']).default('higher'),
  // Kept as the input's string; empty means no target.
  target: z
    .string()
    .trim()
    .refine((value) => value === '' || Number(value) >= 0, {
      error: 'nonNegative',
    })
    .default(''),
});

export type UpsertTestTypeSchemaValues = z.infer<typeof UpsertTestTypeSchema>;

export const TestNoteSchema = z.object({
  // Empty = a general note, not tied to a test type.
  type_id: z.string().default(''),
  content: z.string().trim().min(3).max(1000),
  goal: z
    .string()
    .trim()
    .refine((value) => value === '' || Number(value) >= 0, {
      error: 'nonNegative',
    })
    .default(''),
});

export type TestNoteSchemaValues = z.infer<typeof TestNoteSchema>;
