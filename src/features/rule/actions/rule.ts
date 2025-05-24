'use server';

import pg from 'pg';

import { Rule } from '@/drizzle/schema';
import { Response, ResponseFactory } from '@/utils/response';

import { getTeam } from '@/features/team/actions/team';
import { getRule as getAction, insertRule, updateRule } from '../db/rule';

export async function getRule(): Promise<Nullish<Rule>> {
  const team = await getTeam();
  if (!team) return null;

  return await getAction(team.team_id);
}

export async function executeRule(
  content: string
): Promise<Response<Nullable<Rule>>> {
  const team = await getTeam();

  if (!team) {
    return ResponseFactory.error<Nullable<Rule>>('Team not found');
  }

  try {
    const existingRule = await getRule();
    let updatedRule: Rule;

    if (existingRule) {
      updatedRule = await updateRule(existingRule.rule_id, content);
      return ResponseFactory.success<Rule>(
        'Rule updated successfully',
        updatedRule
      );
    } else {
      const newRule = await insertRule({ team_id: team.team_id, content });
      // Fetch the complete rule data after insert
      updatedRule = (await getAction(team.team_id)) as Rule;
      return ResponseFactory.success<Rule>(
        'New rule created successfully',
        updatedRule
      );
    }
  } catch (error) {
    if (error instanceof pg.DatabaseError && error.code === '23505') {
      return ResponseFactory.error<Nullable<Rule>>(error.detail);
    }
    return ResponseFactory.fromError<Nullable<Rule>>(error as Error);
  }
}
