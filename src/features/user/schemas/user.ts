import { z } from 'zod';

import { CoachPosition, UserRole, UserState } from '@/utils/enum';

import { USER_SCHEMA_VALIDATION } from './utils';

const { name, dob, email, roles, state, coach_position, join_date } =
  USER_SCHEMA_VALIDATION;

export const AddUserSchema = z.object({
  name,
  email,
  dob,
  roles: roles
    .min(1, { message: 'Select at least one role.' })
    .max(2, { message: 'Select at most two roles.' })
    .default([UserRole.PLAYER]),
  state: state.default(UserState.ACTIVE),
  coach_position: coach_position.default(CoachPosition.HEAD_COACH),
  join_date,
});

export const EditProfileSchema = z.object({
  dob,
  height: z.number().min(0).max(200).describe('cm').optional(),
  weight: z.number().min(0).max(100).describe('kg').optional(),
  jersey_number: z.number().min(0).max(99).optional(),
});

export const FilterUsersSchema = z.object({
  query: z.string().default('').optional(),
  roles: roles.default([]).optional(),
  state: z.array(state).default([]).optional(),
});

export type AddUserValues = z.infer<typeof AddUserSchema>;
export type EditProfileValues = z.infer<typeof EditProfileSchema>;
export type FilterUsersValues = z.infer<typeof FilterUsersSchema>;
