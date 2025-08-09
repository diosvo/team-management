import { z } from 'zod';

import {
  DEFAULT_DOB,
  ESTABLISHED_DATE,
  SELECTABLE_COACH_POSITIONS,
  SELECTABLE_PLAYER_POSITIONS,
  SELECTABLE_ROLES,
  SELECTABLE_STATES,
} from '@/utils/constant';
import {
  CoachPosition,
  PlayerPosition,
  UserRole,
  UserState,
} from '@/utils/enum';

// date() - YYYY-MM-DD

export const USER_SCHEMA_VALIDATION = {
  team_id: z.uuid(),
  name: z
    .string()
    .min(6, { error: 'Be at least 6 characters long.' })
    .max(128, { error: 'Be at most 128 characters long.' })
    .trim()
    .default(''),
  dob: z.iso.date().nullable().default(DEFAULT_DOB),
  email: z.email({ error: 'Please enter a valid email.' }).default(''),
  phone_number: z.union([
    z
      .string()
      .length(10, { error: 'Must contain exactly 10 digit.' })
      .nullish(),
    z.literal(''),
  ]),
  citizen_identification: z.union([
    z
      .string()
      .length(12, { error: 'Must contain exactly 12 digit.' })
      .nullish(),
    z.literal(''),
  ]),
  password: z
    .string()
    .min(8, { error: 'Be at least 8 characters long.' })
    .max(128, { error: 'Be at most 128 characters long.' })
    .regex(/[a-zA-Z]/, { error: 'Contain at least one letter.' })
    .regex(/[0-9]/, { error: 'Contain at least one number.' })
    .regex(/[^a-zA-Z0-9]/, {
      error: 'Contain at least one special character.',
    })
    .trim()
    .default(''),
  state: z.enum(SELECTABLE_STATES).default(UserState.UNKNOWN),
  role: z.enum(SELECTABLE_ROLES).default(UserRole.PLAYER),
  join_date: z.iso.date().nullable().default(ESTABLISHED_DATE),
};

export const PLAYER_VALIDATION = {
  position: z.enum(SELECTABLE_PLAYER_POSITIONS).default(PlayerPosition.UNKNOWN),
  // Handle empty strings before the coercion, unless it automatically converts empty string to 0
  jersey_number: z
    .union([
      z.literal('').transform(() => null),
      z.literal(null),
      z.literal(undefined),
      z.coerce
        .number()
        .min(0, 'Must be at least 0.')
        .max(99, 'Cannot exceed 99.'),
    ])
    .optional(),
  // Temporrily disabled
  // height: z.coerce.number().int().min(0).max(200).nullish(),
  // weight: z.coerce.number().int().min(0).max(100).nullish(),
};

export const COACH_VALIDATION = {
  position: z.enum(SELECTABLE_COACH_POSITIONS).default(CoachPosition.UNKNOWN),
};
