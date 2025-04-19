'use server';

import { Response, ResponseFactory } from '@/utils/response';

import { getRule, insertRule, updateRule } from '../db/rule';
import { RuleSchema, RuleValues } from '../schemas/rule';

export async function executeRule(values: RuleValues): Promise<Response> {
  const { success, data } = RuleSchema.safeParse(values);

  if (!success) {
    return ResponseFactory.error('There was an error while processing request');
  }

  try {
    const existingRule = await getRule(data.team_id);

    if (existingRule) {
      await updateRule(existingRule.rule_id, data.content);
      return ResponseFactory.success('Rule updated successfully');
    } else {
      await insertRule(data);
      return ResponseFactory.success('New rule created successful');
    }
  } catch (error) {
    return ResponseFactory.fromError(error as Error);
  }
}
