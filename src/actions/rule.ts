'use server';

import { getTranslations } from 'next-intl/server';
import { revalidate } from '@/actions/cache';
import { getDbErrorMessage } from '@/db/pg-error';
import { getRule as getAction, upsertRule as saveRule } from '@/db/rule';

import { ResponseFactory } from '@/utils/response';
import { withAuth, withResource } from './auth';

const teamRule = withResource('team-rule');

export const getRule = withAuth(
  async ({ team_id }) => await getAction(team_id),
);

// The rule is a per-team singleton that is created lazily, so maintaining it
// is one `edit` right; requiring `create` too would lock out Captains, who
// only hold `team-rule:edit`.
export const upsertRule = teamRule(
  ['edit'],
  async function upsert({ team_id }, content: string) {
    const t = await getTranslations('actions.rule');
    try {
      // The row always exists, so the only thing "added" vs "updated"
      // distinguishes is whether the team had any rules written yet.
      const existing = await getAction(team_id);

      await saveRule(team_id, content);

      revalidate.rule();

      return ResponseFactory.success(
        t(existing?.rule_content ? 'updated' : 'added'),
      );
    } catch (error) {
      const { message } = getDbErrorMessage(error);
      return ResponseFactory.error(message);
    }
  },
);
