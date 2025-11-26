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

export const EditTeamInfoSchema = z.object({
  user: z.object({
    role,
    state,
    join_date,
  }),
  player: z.object({ jersey_number }),
  position,
});

export const EditPersonalInfoSchema = z.object({
  name,
  dob,
  phone_number,
  citizen_identification,
});

export type AddUserValues = z.infer<typeof AddUserSchema>;
export type EditTeamInfoValues = z.infer<typeof EditTeamInfoSchema>;
export type EditPersonalInfoValues = z.infer<typeof EditPersonalInfoSchema>;
