import { and, desc, eq, isNull } from 'drizzle-orm';

import db from '@/drizzle';
import { UserTable } from '@/drizzle/schema/user';
import { UserTeam, UserTeamTable } from '@/drizzle/schema/user-team';

/** Every stint the user has had, most recent first. */
export async function getMemberships(
  user_id: string,
): Promise<Array<UserTeam>> {
  try {
    return await db.query.UserTeamTable.findMany({
      where: eq(UserTeamTable.user_id, user_id),
      orderBy: desc(UserTeamTable.join_date),
    });
  } catch {
    return [];
  }
}

/** The open stint — the one without a `leave_date`. */
export async function getCurrentMembership(
  user_id: string,
): Promise<Nullish<UserTeam>> {
  try {
    return await db.query.UserTeamTable.findFirst({
      where: and(
        eq(UserTeamTable.user_id, user_id),
        isNull(UserTeamTable.leave_date),
      ),
    });
  } catch {
    return null;
  }
}

export async function insertMembership(
  user_id: string,
  team_id: string,
  join_date: string,
) {
  const [row] = await db
    .insert(UserTeamTable)
    .values({ user_id, team_id, join_date })
    .returning({ user_team_id: UserTeamTable.user_team_id });
  return row;
}

/**
 * Move a user to another team, or bring a returning member back. Closes the
 * open stint the day the new one starts and repoints `user.team_id`, so the
 * pointer and the history can never disagree.
 */
export async function transferMembership(
  user_id: string,
  team_id: string,
  join_date: string,
) {
  return await db.transaction(async (tx) => {
    await tx
      .update(UserTeamTable)
      .set({ leave_date: join_date })
      .where(
        and(
          eq(UserTeamTable.user_id, user_id),
          isNull(UserTeamTable.leave_date),
        ),
      );

    const [row] = await tx
      .insert(UserTeamTable)
      .values({ user_id, team_id, join_date })
      .returning({ user_team_id: UserTeamTable.user_team_id });

    await tx
      .update(UserTable)
      .set({ team_id })
      .where(eq(UserTable.id, user_id));

    return row;
  });
}

/** Correct the dates on the stint the user is currently serving. */
export async function updateCurrentMembership(
  user_id: string,
  values: Partial<Pick<UserTeam, 'join_date' | 'leave_date'>>,
) {
  return await db
    .update(UserTeamTable)
    .set(values)
    .where(
      and(eq(UserTeamTable.user_id, user_id), isNull(UserTeamTable.leave_date)),
    );
}
