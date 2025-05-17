import { z } from 'zod';

import {
  SELECTABLE_COACH_POSITIONS,
  SELECTABLE_PLAYER_POSITIONS,
  SELECTABLE_ROLES,
  SELECTABLE_STATES,
} from '@/utils/constant';
import { UserRole, UserState } from '@/utils/enum';

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
  phone_number: z.string().length(10).optional(),
  citizen_identification: z.string().length(12).optional(),
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
  state: z.enum(SELECTABLE_STATES).default(UserState.UNKNOWN),
  role: z.enum(SELECTABLE_ROLES).default(UserRole.PLAYER),
  join_date: z.string().date().optional(),
};

export const PLAYER_COACH_VALIDATION = {
  position: z
    .union([
      z.enum(SELECTABLE_COACH_POSITIONS),
      z.enum(SELECTABLE_PLAYER_POSITIONS),
    ])
    .optional(),
};
