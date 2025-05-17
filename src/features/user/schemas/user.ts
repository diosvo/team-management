import { z } from 'zod';

import { UserRole, UserState } from '@/utils/enum';

import { PLAYER_COACH_VALIDATION, USER_SCHEMA_VALIDATION } from './utils';

const {
  name,
  dob,
  email,
  phone_number,
  citizen_identification,
  roles,
  state,
  join_date,
} = USER_SCHEMA_VALIDATION;
const { position } = PLAYER_COACH_VALIDATION;

export const AddUserSchema = z.object({
  name,
  email,
  dob,
  roles: roles
    .min(1, { message: 'Select at least one role.' })
    .max(2, { message: 'Select at most two roles.' })
    .default([UserRole.PLAYER]),
  state: state.default(UserState.ACTIVE),
  join_date,
  position,
});

export const EditProfileSchema = z.object({
  // User
  name: name.optional(),
  dob,
  phone_number,
  citizen_identification,
  // Player
  jersey_number: z.number().optional().describe('Jersey Number'),
  height: z.number().optional().describe('cm'),
  weight: z.number().optional().describe('kg'),
});

export const FilterUsersSchema = z.object({
  query: z.string().default('').optional(),
  roles: roles.default([]).optional(),
  state: z.array(state).default([]).optional(),
});

export type AddUserValues = z.infer<typeof AddUserSchema>;
export type EditProfileValues = z.infer<typeof EditProfileSchema>;
export type FilterUsersValues = z.infer<typeof FilterUsersSchema>;
