'use server';

import { z } from 'zod';

import { insertRule } from '../db/rule';
import { canCreateRule } from '../permissions/rule';
import { ruleSchema } from '../schemas/rule';

export async function createRule(unsafeData: z.infer<typeof ruleSchema>) {
  const { success, data } = ruleSchema.safeParse(unsafeData);

  if (!success || !canCreateRule({ role: 'SUPER_ADMIN' })) {
    return { error: true, message: 'There was an error creating rule' };
  }

  await insertRule(data);

  return { error: false, message: 'Successfully created new rule' };
}
