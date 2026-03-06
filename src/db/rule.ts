import { cacheTag } from 'next/cache';

import { eq } from 'drizzle-orm';

import db from '@/drizzle';
import { InsertRule, RuleTable } from '@/drizzle/schema/rule';

import { CACHE_TAG } from '@/utils/constant';

export async function getRule(team_id: string) {
  'use cache';
  cacheTag(CACHE_TAG.RULE);

  try {
    return await db.query.RuleTable.findFirst({
      where: eq(RuleTable.team_id, team_id),
    });
  } catch {
    return null;
  }
}

export async function insertRule(data: InsertRule) {
  return await db.insert(RuleTable).values(data);
}

export async function updateRule(rule_id: string, content: string) {
  return await db
    .update(RuleTable)
    .set({ content })
    .where(eq(RuleTable.rule_id, rule_id));
}
