import { z } from 'zod';

import { USER_SCHEMA_VALIDATION } from './utils';

const { name, optional_email } = USER_SCHEMA_VALIDATION;

/**
 * The sign-in identity an admin can correct; role and state live on Profile.
 * Email may stay blank only while the member has none (see `updateAccount`).
 */
export const UpdateAccountSchema = z.object({ name, email: optional_email });

export type UpdateAccountValues = z.infer<typeof UpdateAccountSchema>;
