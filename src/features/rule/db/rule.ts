import { eq } from 'drizzle-orm';

import db from '@/db';
import { InsertRule, RuleTable } from '@/db/schema/rule';

import { revalidateRuleCache } from './cache';

export async function fetchRule(team_id: string) {
  const [data] = await db
    .select()
    .from(RuleTable)
    .where(eq(RuleTable.team_id, team_id));

  return data;
}

export async function insertRule(data: InsertRule) {
  const [newRule] = await db.insert(RuleTable).values(data).returning();

  if (newRule == null) throw new Error('Failed to create rule');

  revalidateRuleCache(newRule.rule_id);

  return newRule;
}

export async function updateRule(rule_id: string, content: string) {
  const [data] = await db
    .update(RuleTable)
    .set({ content })
    .where(eq(RuleTable.rule_id, rule_id))
    .returning();

  if (data == null) return 0;

  return data;
}
