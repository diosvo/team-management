import { getGlobalTag } from '@/lib/data-cache';

export function getTeamTag() {
  return getGlobalTag('team');
}
