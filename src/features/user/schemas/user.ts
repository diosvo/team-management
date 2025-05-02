import { z } from 'zod';

import { UserRole, UserState } from '@/utils/enum';

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
  join_date,
});

export const UpdateUserSchema = z.object({
  dob,
});

export const FilterUsersSchema = z.object({
  query: z.string().default('').optional(),
  roles: roles.default([]).optional(),
  state: z.array(state).default([]).optional(),
});

export type AddUserValues = z.infer<typeof AddUserSchema>;
export type UpdateUserValues = z.infer<typeof UpdateUserSchema>;
export type FilterUsersValues = z.infer<typeof FilterUsersSchema>;
