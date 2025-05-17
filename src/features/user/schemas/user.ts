import { z } from 'zod';

import { PLAYER_COACH_VALIDATION, USER_SCHEMA_VALIDATION } from './utils';

const {
  name,
  dob,
  email,
  phone_number,
  citizen_identification,
  role,
  state,
  join_date,
} = USER_SCHEMA_VALIDATION;
const { position } = PLAYER_COACH_VALIDATION;

export const AddUserSchema = z.object({
  name,
  email,
  dob,
  role,
  state,
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
  // System
  role,
  state,
  position,
});

export const FilterUsersSchema = z.object({
  query: z.string().default('').optional(),
  role: z.array(role).default([]).optional(),
  state: z.array(state).default([]).optional(),
});

export type AddUserValues = z.infer<typeof AddUserSchema>;
export type EditProfileValues = z.infer<typeof EditProfileSchema>;
export type FilterUsersValues = z.infer<typeof FilterUsersSchema>;
