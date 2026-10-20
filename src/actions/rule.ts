'use server';

import { revalidate } from '@/actions/cache';
import { getDbErrorMessage } from '@/db/pg-error';
import { getRule as getAction, upsertRule as saveRule } from '@/db/rule';

import { ResponseFactory } from '@/utils/response';
import { withAuth, withResource } from './auth';

const teamRule = withResource('team-rule');

export const getRule = withAuth(
  async ({ team_id }) => await getAction(team_id),
);

export const upsertRule = teamRule(
  ['create', 'edit'],
  async function upsert({ team_id }, content: string) {
    try {
      // The row always exists, so the only thing "added" vs "updated"
      // distinguishes is whether the team had any rules written yet.
      const existing = await getAction(team_id);

      await saveRule(team_id, content);

      revalidate.rule();

      return ResponseFactory.success(
        `${existing?.rule_content ? 'Updated' : 'Added'} rule successfully`,
      );
    } catch (error) {
      const { message } = getDbErrorMessage(error);
      return ResponseFactory.error(message);
    }
  },
);
