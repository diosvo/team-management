import { z } from 'zod';

import { CoachPosition, UserRole, UserState } from '@/utils/enum';

import { SELECTABLE_COACH_POSITIONS } from '@/utils/constant';
import { USER_SCHEMA_VALIDATION } from './utils';

const { name, dob, email, roles, state, join_date } = USER_SCHEMA_VALIDATION;

export const AddUserSchema = z.object({
  name,
  email,
  dob,
  roles: roles
    .min(1, { message: 'Select at least one role.' })
    .max(2, { message: 'Select at most two roles.' })
    .default([UserRole.PLAYER]),
  state: state.default(UserState.ACTIVE),
  coach_position: z
    .enum(SELECTABLE_COACH_POSITIONS)
    .default(CoachPosition.HEAD_COACH),
  join_date,
});

export const EditProfileSchema = z.object({
  // User
  name: name.optional(),
  dob,
  phone_number: z.string().trim().optional(),
  citizen_identification: z.string().optional(),
  // Player
  jersey_number: z.union([z.number().min(0).max(99), z.null()]).optional(),
  height: z
    .union([z.number().min(0).max(200), z.null()])
    .describe('cm')
    .optional(),
  weight: z
    .union([z.number().min(0).max(100), z.null()])
    .describe('kg')
    .optional(),
});

export const FilterUsersSchema = z.object({
  query: z.string().default('').optional(),
  roles: roles.default([]).optional(),
  state: z.array(state).default([]).optional(),
});

export type AddUserValues = z.infer<typeof AddUserSchema>;
export type EditProfileValues = z.infer<typeof EditProfileSchema>;
export type FilterUsersValues = z.infer<typeof FilterUsersSchema>;
