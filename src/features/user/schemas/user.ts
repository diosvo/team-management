import { z } from 'zod';

import {
  COACH_VALIDATION,
  PLAYER_VALIDATION,
  USER_SCHEMA_VALIDATION,
} from './utils';
const { position: PlayerPosition, ...PlayerSchema } = PLAYER_VALIDATION;
const { position: CoachPosition } = COACH_VALIDATION;

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

const position = z.union([PlayerPosition, CoachPosition]).optional();

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
  user: z
    .object({
      name,
      dob,
      phone_number,
      citizen_identification,
      state,
    })
    .default({}),
  player: z.object(PlayerSchema).default({}),
  position,
});

export const FilterUsersSchema = z.object({
  query: z.string().default(''),
  role: z.array(role).default([]),
  state: z.array(state).default([]),
});

export type AddUserValues = z.infer<typeof AddUserSchema>;
export type EditProfileValues = z.infer<typeof EditProfileSchema>;
export type FilterUsersValues = z.infer<typeof FilterUsersSchema>;
