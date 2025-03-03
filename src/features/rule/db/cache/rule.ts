import { getGlobalTag, getIdTag } from '@/lib/data-cache';
import { revalidateTag } from 'next/cache';

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
