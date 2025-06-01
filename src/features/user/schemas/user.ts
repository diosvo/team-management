import { z } from 'zod';

import {
  COACH_VALIDATION,
  PLAYER_VALIDATION,
  USER_SCHEMA_VALIDATION,
} from './utils';
const { position: PlayerPosition, jersey_number } = PLAYER_VALIDATION;
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

const position = z.union([PlayerPosition, CoachPosition]).nullish();

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
  player: z.object({}).default({}),
  position,
});

export const EditTeamInfoSchema = z.object({
  user: z.object({
    role,
    state,
  }),
  player: z.object({ jersey_number }),
  position,
});

export const FilterUsersSchema = z.object({
  query: z.string().default(''),
  role: z.array(role).default([]),
  state: z.array(state).default([]),
});

export type AddUserValues = z.infer<typeof AddUserSchema>;
export type EditProfileValues = z.infer<typeof EditProfileSchema>;
export type EditTeamInfoValues = z.infer<typeof EditTeamInfoSchema>;
export type FilterUsersValues = z.infer<typeof FilterUsersSchema>;
