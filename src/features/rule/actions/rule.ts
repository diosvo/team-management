'use server';

import { Response, ResponseFactory } from '@/utils/response';

import { Rule } from '@/drizzle/schema';

import { getTeam } from '@/features/team/actions/team';
import { getRule as getAction, insertRule, updateRule } from '../db/rule';

export async function getRule(): Promise<OptionalNullable<Rule>> {
  const team = await getTeam();
  if (!team) return;

  return await getAction(team.team_id);
}

export async function executeRule(content: string): Promise<Response> {
  const team = await getTeam();

  if (!team) {
    return ResponseFactory.error('Team not found');
  }

  try {
    const existingRule = await getRule();

    if (existingRule) {
      await updateRule(existingRule.rule_id, content);
      return ResponseFactory.success('Rule updated successfully');
    } else {
      await insertRule({ team_id: team.team_id, content });
      return ResponseFactory.success('New rule created successful');
    }
  } catch (error) {
    return ResponseFactory.fromError(error as Error);
  }
}
