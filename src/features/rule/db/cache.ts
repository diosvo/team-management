import { getGlobalTag } from '@/lib/data-cache';

export function getRuleTag() {
  return getGlobalTag('rule');
}

export function revalidateRuleTag() {
  return getGlobalTag('rule');
}
