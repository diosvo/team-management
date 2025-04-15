import { z } from 'zod';

import { USER_SCHEMA_VALIDATION } from './utils';

const { team_id, name, email, roles } = USER_SCHEMA_VALIDATION;

export const AddUserSchema = z.object({
  team_id,
  name,
  email,
  roles,
});

export type AddUserValues = z.infer<typeof AddUserSchema>;
