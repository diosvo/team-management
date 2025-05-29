import { eq } from 'drizzle-orm';

import { db } from '@/drizzle';
import { InsertRule, RuleTable } from '@/drizzle/schema/rule';

export async function getRule(team_id: string) {
  try {
    return await db.query.RuleTable.findFirst({
      where: eq(RuleTable.team_id, team_id),
    });
  } catch {
    return null;
  }
}

export async function insertRule(data: InsertRule) {
  try {
    const [rule] = await db.insert(RuleTable).values(data).returning();

    return rule;
  } catch (error) {
    throw error;
  }
}

export async function updateRule(rule_id: string, content: string) {
  try {
    const [rule] = await db
      .update(RuleTable)
      .set({ content })
      .where(eq(RuleTable.rule_id, rule_id))
      .returning();

    return rule;
  } catch (error) {
    throw error;
  }
}
