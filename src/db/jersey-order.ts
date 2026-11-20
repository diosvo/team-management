import { and, eq, or } from 'drizzle-orm';

import { UserRole } from '@/utils/enum';

import { hasRealEmail } from '@/db/account';
import db from '@/drizzle';
import { PlayerTable } from '@/drizzle/schema/player';
import { TeamTable } from '@/drizzle/schema/team';
import { UserTable } from '@/drizzle/schema/user';

/** What the roster dialog needs to reopen the sheet. */
export type JerseyOrderSheetLink = { url: string; updated_at: Date };

export const spreadsheetUrl = (spreadsheet_id: string) =>
  `https://docs.google.com/spreadsheets/d/${spreadsheet_id}/edit`;

/** The team's uniform-order sheet, only when it was saved in `year`. */
export async function selectJerseyOrderSheet(
  team_id: string,
  year: number,
): Promise<Nullable<JerseyOrderSheetLink>> {
  try {
    const [team] = await db
      .select({
        spreadsheet_id: TeamTable.uniform_order_spreadsheet_id,
        updated_at: TeamTable.uniform_order_updated_at,
      })
      .from(TeamTable)
      .where(eq(TeamTable.team_id, team_id))
      .limit(1);

    if (!team?.spreadsheet_id || !team.updated_at) return null;
    // Last year's sheet belongs to last year's order.
    if (team.updated_at.getFullYear() !== year) return null;

    return {
      url: spreadsheetUrl(team.spreadsheet_id),
      updated_at: team.updated_at,
    };
  } catch {
    return null;
  }
}

/** Points the team at a new uniform-order sheet, replacing the old one. */
export async function updateJerseyOrderSheet(
  team_id: string,
  spreadsheet_id: string,
) {
  return await db
    .update(TeamTable)
    .set({
      uniform_order_spreadsheet_id: spreadsheet_id,
      uniform_order_updated_at: new Date(),
    })
    .where(eq(TeamTable.team_id, team_id));
}

/** Emails of the team's super admins and captains: who may tick payments. */
export async function selectPaymentEditorEmails(
  team_id: string,
): Promise<Array<string>> {
  try {
    const rows = await db
      .select({ email: UserTable.email })
      .from(UserTable)
      .leftJoin(PlayerTable, eq(PlayerTable.id, UserTable.id))
      .where(
        and(
          eq(UserTable.team_id, team_id),
          hasRealEmail(),
          or(
            eq(UserTable.role, UserRole.SUPER_ADMIN),
            eq(PlayerTable.is_captain, true),
          ),
        ),
      );
    return rows.map(({ email }) => email);
  } catch {
    return [];
  }
}
