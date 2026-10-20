import type { TeamRule } from '@/drizzle/schema';
import { MOCK_TEAM } from './team';

export const MOCK_RULE: TeamRule = {
  rule_content: MOCK_TEAM.rule_content,
  rule_updated_at: MOCK_TEAM.rule_updated_at,
};
