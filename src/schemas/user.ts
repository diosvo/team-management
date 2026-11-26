import { z } from 'zod';

import {
  COACH_VALIDATION,
  PLAYER_VALIDATION,
  USER_SCHEMA_VALIDATION,
} from './utils';
const {
  position: PlayerPosition,
  jersey_number,
  jersey_name,
  shirt_size,
  short_size,
  short_form,
} = PLAYER_VALIDATION;
const { position: CoachPosition } = COACH_VALIDATION;

const {
  name,
  dob,
  optional_email,
  phone_number,
  citizen_identification,
  role,
  state,
  join_date,
} = USER_SCHEMA_VALIDATION;

export const AddUserSchema = z.object({
  name,
  email: optional_email,
  dob,
  role,
  state,
  join_date,
  position: z.union([PlayerPosition, CoachPosition]).nullish(),
});

export const EditTeamInfoSchema = z.object({
  user: z.object({
    role,
    state,
    join_date,
  }),
  player: z.object({
    jersey_number,
    jersey_name,
    shirt_size,
    short_size,
    short_form,
    position: PlayerPosition.nullish(),
  }),
  coach: z.object({ position: CoachPosition }),
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
