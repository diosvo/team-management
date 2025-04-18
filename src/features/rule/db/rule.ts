import { cache } from 'react';

import { eq } from 'drizzle-orm';

import { db } from '@/drizzle';
import { InsertRule, RuleTable } from '@/drizzle/schema/rule';
import logger from '@/lib/logger';

import { revalidateRuleCache } from './cache';

export const fetchRule = cache(async (team_id: string) => {
  return await db.query.RuleTable.findFirst({
    where: eq(RuleTable.team_id, team_id),
    columns: { rule_id: true, content: true },
  });
});

export async function insertRule(data: InsertRule) {
  const [newRule] = await db.insert(RuleTable).values(data).returning();

  if (newRule == null) throw new Error('Failed to create rule');

  revalidateRuleCache(newRule.rule_id);

  return newRule;
}

export async function updateRule(rule_id: string, content: string) {
  try {
    const [data] = await db
      .update(RuleTable)
      .set({ content })
      .where(eq(RuleTable.rule_id, rule_id))
      .returning();

    if (data == null) return null;

    revalidateRuleCache(data.rule_id);

    return data;
  } catch (error) {
    logger.error('Failed to update rule', error);
    return null;
  }
}
