'use server';

import { z } from 'zod';

import { fetchRule, insertRule, updateRule } from '../db/rule';
import { canExecute } from '../permissions/rule';
import { RuleSchema } from '../schemas/rule';

export async function getRule(team_id: string) {
  return await fetchRule(team_id);
}

export async function executeRule(unsafeData: z.infer<typeof RuleSchema>) {
  const { success, data } = RuleSchema.safeParse(unsafeData);

  if (!success || !canExecute({ role: 'SUPER_ADMIN' })) {
    return { error: true, message: 'There was an error while creating rule' };
  }

  try {
    const existingRule = await fetchRule(data.team_id);
    if (existingRule) {
      await updateRule(existingRule.rule_id, data.content);
      return { error: false, message: 'Rule updated successfully' };
    } else {
      await insertRule(data);
      return { error: false, message: 'New rule created successfully' };
    }
  } catch (error) {
    return { error: true, message: (error as Error).message };
  }
}
