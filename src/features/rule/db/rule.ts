import { eq } from 'drizzle-orm';

import { db } from '@/drizzle';
import { InsertRule, RuleTable } from '@/drizzle/schema/rule';
import { unstable_cache } from 'next/cache';
import { getRuleTag, revalidateRuleTag } from './cache';

export const getRule = unstable_cache(
  async (team_id: string) => {
    try {
      return await db.query.RuleTable.findFirst({
        where: eq(RuleTable.team_id, team_id),
      });
    } catch {
      return null;
    }
  },
  [getRuleTag()],
  {
    tags: [getRuleTag()],
    revalidate: 3600,
  }
);

export async function insertRule(data: InsertRule) {
  try {
    const [rule] = await db.insert(RuleTable).values(data).returning({
      rule_id: RuleTable.rule_id,
    });

    revalidateRuleTag();

    return rule;
  } catch (error) {
    throw error;
  }
}

export async function updateRule(rule_id: string, content: string) {
  try {
    const [data] = await db
      .update(RuleTable)
      .set({ content })
      .where(eq(RuleTable.rule_id, rule_id))
      .returning();

    revalidateRuleTag();

    return data;
  } catch (error) {
    throw error;
  }
}
