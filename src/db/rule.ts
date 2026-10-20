import { eq } from 'drizzle-orm';

import db from '@/drizzle';
import { type NullishTeamRule, TeamTable } from '@/drizzle/schema/team';

/**
 * The rule document lives on `team` (`rule_content`), not in a table of its
 * own. `rule_updated_at` is maintained here so the editor's "last updated"
 * tracks revisions to the rules rather than any edit to the team.
 */
export async function getRule(team_id: string): Promise<NullishTeamRule> {
  try {
    const team = await db.query.TeamTable.findFirst({
      columns: { rule_content: true, rule_updated_at: true },
      where: eq(TeamTable.team_id, team_id),
    });

    return team ?? null;
  } catch {
    return null;
  }
}

export async function upsertRule(team_id: string, content: string) {
  return await db
    .update(TeamTable)
    .set({ rule_content: content, rule_updated_at: new Date() })
    .where(eq(TeamTable.team_id, team_id));
}
