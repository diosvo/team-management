import { revalidateTag } from 'next/cache';

import { getIdTag } from '@/lib/data-cache';

export function getRuleIdTag(rule_id: string) {
  return getIdTag('rule', rule_id);
}

export function revalidateRuleCache(rule_id: string) {
  revalidateTag(getRuleIdTag(rule_id));
}
