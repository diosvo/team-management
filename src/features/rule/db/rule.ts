import { eq } from 'drizzle-orm';

import { db } from '@/drizzle';
import { InsertRule, RuleTable } from '@/drizzle/schema/rule';
import logger from '@/lib/logger';
import { revalidateRuleTag } from './cache';

export const getRule = async (team_id: string) => {
  try {
    return await db.query.RuleTable.findFirst({
      where: eq(RuleTable.team_id, team_id),
    });
  } catch (error) {
    logger.error('Failed to get rule', error);
    return null;
  }
};

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
      .returning({
        rule_id: RuleTable.rule_id,
      });

    revalidateRuleTag();

    return data;
  } catch (error) {
    throw error;
  }
}
