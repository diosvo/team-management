import { z } from 'zod';

import {
  ESTABLISHED_DATE,
  SELECTABLE_ROLES,
  SELECTABLE_STATES,
} from '@/utils/constant';

// date() - YYYY-MM-DD

export const USER_SCHEMA_VALIDATION = {
  team_id: z.string().uuid(),
  name: z
    .string()
    .min(6, { message: 'Be at least 6 characters long.' })
    .trim()
    .default(''),
  dob: z.string().date().optional(),
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
    .trim()
    .default(''),
  roles: z.array(z.enum(SELECTABLE_ROLES)),
  state: z.enum(SELECTABLE_STATES),
  join_date: z.string().date().optional().default(ESTABLISHED_DATE),
};
