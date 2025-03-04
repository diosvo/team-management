import { revalidateTag } from 'next/cache';

import { getGlobalTag, getIdTag } from '@/lib/data-cache';

export function getRuleGlobalTag() {
  return getGlobalTag('rule');
}

export function getRuleIdTag(rule_id: string) {
  return getIdTag('rule', rule_id);
}

export function revalidateRuleCache(rule_id: string) {
  revalidateTag(getRuleGlobalTag());
  revalidateTag(getRuleIdTag(rule_id));
}
