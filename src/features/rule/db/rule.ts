import db from '@/db';
import { RuleTable } from '@/db/schema/rule';

import { revalidateRuleCache } from './cache/rule';

export async function insertRule(data: typeof RuleTable.$inferInsert) {
  const newRule = await db.transaction(async (trx) => {
    const [newRule] = await trx.insert(RuleTable).values(data).returning();

    return newRule;
  });

  if (newRule == null) throw new Error('Failed to create rule');

  revalidateRuleCache(newRule.rule_id);

  return newRule;
}
