import { z } from 'zod';

import { SELECTABLE_ROLES } from '@/drizzle/schema';

export const USER_SCHEMA_VALIDATION = {
  name: z
    .string()
    .min(6, { message: 'Be at least 6 characters long.' })
    .trim()
    .default(''),
  email: z
    .string()
    .email({ message: 'Please enter a valid email.' })
    .trim()
    .default(''),
  password: z
    .string()
    .min(8, { message: 'Be at least 8 characters long.' })
    .regex(/[a-zA-Z]/, { message: 'Contain at least one letter.' })
    .regex(/[0-9]/, { message: 'Contain at least one number.' })
    .regex(/[^a-zA-Z0-9]/, {
      message: 'Contain at least one special character.',
    })
    .trim(),
  roles: z.array(z.enum(SELECTABLE_ROLES)).min(1).max(2).default(['PLAYER']),
};
