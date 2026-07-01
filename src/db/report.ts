import { and, eq, inArray, ne, or } from 'drizzle-orm';

import db from '@/drizzle';
import { PlayerTable, UserTable } from '@/drizzle/schema';

import { UserRole } from '@/utils/enum';

/** Roles that always receive scheduled reports and are not user-selectable. */
const DEFAULT_REPORT_ROLES = [UserRole.COACH, UserRole.SUPER_ADMIN];

/**
 * @description Team members a user can pick as report recipients.
 */
export async function fetchReportRecipients(team_id: string) {
  try {
    return await db.query.UserTable.findMany({
      where: and(
        eq(UserTable.team_id, team_id),
        ne(UserTable.role, UserRole.SUPER_ADMIN),
      ),
      columns: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });
  } catch {
    return [];
  }
}

/**
 * @description Emails that always receive a report.
 * @default Coach, Super Admin and team captain
 */
export async function fetchDefaultRecipientEmails(
  team_id: string,
): Promise<Array<string>> {
  try {
    const rows = await db
      .selectDistinct({ email: UserTable.email })
      .from(UserTable)
      .leftJoin(PlayerTable, eq(PlayerTable.id, UserTable.id))
      .where(
        and(
          eq(UserTable.team_id, team_id),
          or(
            inArray(UserTable.role, DEFAULT_REPORT_ROLES),
            eq(PlayerTable.is_captain, true),
          ),
        ),
      );
    return rows.map((row) => row.email);
  } catch {
    return [];
  }
}
