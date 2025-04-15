'use server';

import { Response, ResponseFactory } from '@/utils/response';

import { fetchRule, insertRule, updateRule } from '../db/rule';
import { RuleSchema, RuleValues } from '../schemas/rule';

export async function getRule(team_id: string) {
  return await fetchRule(team_id);
}

export async function executeRule(values: RuleValues): Promise<Response> {
  const { success, data } = RuleSchema.safeParse(values);

  if (!success) {
    return ResponseFactory.error('There was an error while processing request');
  }

  try {
    const existingRule = await fetchRule(data.team_id);

    if (existingRule) {
      await updateRule(existingRule.rule_id, data.content);
      return ResponseFactory.error('Rule updated successfully');
    } else {
      await insertRule(data);
      return ResponseFactory.success('New rule created successful');
    }
  } catch (error) {
    return ResponseFactory.fromError(error as Error);
  }
}
