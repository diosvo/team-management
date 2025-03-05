import db from '@/db';
import { InsertRule, RuleTable } from '@/db/schema/rule';

import { revalidateRuleCache } from './cache/rule';

export async function insertRule(data: InsertRule) {
  const [newRule] = await db.insert(RuleTable).values(data).returning();

  if (newRule == null) throw new Error('Failed to create rule');

  revalidateRuleCache(newRule.rule_id);

  return newRule;
}
