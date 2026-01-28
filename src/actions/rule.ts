'use server';

import { revalidate } from '@/actions/cache';
import { getDbErrorMessage } from '@/db/pg-error';
import { getRule as getAction, insertRule, updateRule } from '@/db/rule';

import { ResponseFactory } from '@/utils/response';
import { withAuth } from './auth';

export const getRule = withAuth(
  async ({ team_id }) => await getAction(team_id),
);

export const upsertRule = withAuth(async ({ team_id }, content: string) => {
  try {
    const existingRule = await getRule();

    if (existingRule) {
      await updateRule(existingRule.rule_id, content);
    } else {
      await insertRule({ team_id, content });
    }

    revalidate.rule();

    return ResponseFactory.success(
      `${existingRule ? 'Updated' : 'Added'} rule successfully`,
    );
  } catch (error) {
    const { message } = getDbErrorMessage(error);
    return ResponseFactory.error(message);
  }
});
