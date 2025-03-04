'use server';

import { z } from 'zod';

import { insertRule } from '../db/rule';
import { canCreateRule } from '../permissions/rule';
import { ruleSchema } from '../schemas/rule';

export async function createRule(unsafeData: z.infer<typeof ruleSchema>) {
  const { success, data } = ruleSchema.safeParse(unsafeData);

  if (!success || !canCreateRule({ role: 'SUPER_ADMIN' })) {
    return { error: true, message: 'There was an error while creating rule' };
  }

  try {
    await insertRule(data);
    return { error: false, message: 'New rule created successfully' };
  } catch (error) {
    return { error: true, message: (error as Error).message };
  }
}
