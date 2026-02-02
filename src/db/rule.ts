import { cacheTag } from 'next/cache';

import { eq } from 'drizzle-orm';

import { getCacheTag } from '@/actions/cache';
import db from '@/drizzle';
import { InsertRule, RuleTable } from '@/drizzle/schema/rule';

export async function getRule(team_id: string) {
  'use cache';
  cacheTag(getCacheTag.rule());

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
