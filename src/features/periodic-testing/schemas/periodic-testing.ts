import { z } from 'zod';

export const createTestTypeSchema = z.object({
  user_id: z.string().uuid('Invalid user ID'),
  name: z
    .string()
    .min(1, 'Test type name is required')
    .max(128, 'Test type name is too long'),
  unit: z.enum(['']),
});

export const updateTestTypeSchema = z.object({
  name: z
    .string()
    .min(1, 'Test type name is required')
    .max(128, 'Test type name is too long'),
});

// Test Result Schemas
export const createTestResultSchema = z.object({
  user_id: z.string().uuid('Invalid user ID'),
  type_id: z.string().uuid('Invalid test type ID'),
  result: z.string().refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num >= 0;
  }, 'Result must be a valid positive number'),
  test_date: z.date({ invalid_type_error: 'Invalid test date' }),
});

export const updateTestResultSchema = z.object({
  result: z
    .string()
    .refine((val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num >= 0;
    }, 'Result must be a valid positive number')
    .optional(),
  test_date: z.date({ invalid_type_error: 'Invalid test date' }).optional(),
});

export const getTestResultsByDateSchema = z
  .object({
    startDate: z.date({ invalid_type_error: 'Invalid start date' }),
    endDate: z.date({ invalid_type_error: 'Invalid end date' }),
  })
  .refine((data) => data.startDate <= data.endDate, {
    message: 'Start date must be before or equal to end date',
  });

export const getTestResultsByUserAndTypeSchema = z.object({
  user_id: z.string().uuid('Invalid user ID'),
  type_id: z.string().uuid('Invalid test type ID'),
});

// Type exports
export type CreateTestType = z.infer<typeof createTestTypeSchema>;
export type UpdateTestType = z.infer<typeof updateTestTypeSchema>;
export type CreateTestResult = z.infer<typeof createTestResultSchema>;
export type UpdateTestResult = z.infer<typeof updateTestResultSchema>;
export type GetTestResultsByDate = z.infer<typeof getTestResultsByDateSchema>;
export type GetTestResultsByUserAndType = z.infer<
  typeof getTestResultsByUserAndTypeSchema
>;
