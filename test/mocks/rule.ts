import { Rule } from '@/drizzle/schema';
import { MOCK_TEAM } from './team';

export const MOCK_RULE: Rule = {
  rule_id: 'rule-123',
  team_id: MOCK_TEAM.team_id,
  content: 'Rule Content',
  created_at: new Date('2026-01-01'),
  updated_at: new Date('2026-01-01'),
};
