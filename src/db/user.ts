import { and, eq, isNull, ne } from 'drizzle-orm';

import db from '@/drizzle';
import {
  type Coach,
  CoachTable,
  type InsertCoach,
} from '@/drizzle/schema/coach';
import {
  type InsertPlayer,
  type Player,
  PlayerTable,
} from '@/drizzle/schema/player';
import { type InsertUser, type User, UserTable } from '@/drizzle/schema/user';
import { type UserTeam, UserTeamTable } from '@/drizzle/schema/user-team';

import { UserRole, UserState } from '@/utils/enum';

/**
 * The subset of the user row the roster table renders. The full row carries
 * PII (dob, phone, citizen id) that must not cross the RSC boundary.
 */
export type RosterUser = Pick<
  User,
  'id' | 'name' | 'email' | 'state' | 'role' | 'emailVerified'
> &
  Partial<{
    player: Nullish<Pick<Player, 'jersey_number' | 'position'>>;
    coach: Nullish<Pick<Coach, 'position'>>;
  }>;

export async function getRosterUsers(
  team_id: string,
): Promise<Array<RosterUser>> {
  try {
    return await db.query.UserTable.findMany({
      columns: {
        id: true,
        name: true,
        email: true,
        state: true,
        role: true,
        emailVerified: true,
      },
      where: and(
        eq(UserTable.team_id, team_id),
        ne(UserTable.role, UserRole.SUPER_ADMIN),
      ),
      with: {
        player: {
          columns: {
            jersey_number: true,
            position: true,
          },
        },
        coach: {
          columns: {
            position: true,
          },
        },
      },
    });
  } catch {
    return [];
  }
}

export async function getUsers(team_id: string): Promise<Array<User>> {
  try {
    return await db.query.UserTable.findMany({
      where: and(
        eq(UserTable.team_id, team_id),
        ne(UserTable.role, UserRole.SUPER_ADMIN),
      ),
      with: {
        player: true,
        coach: true,
      },
    });
  } catch {
    return [];
  }
}

export async function fetchActivePlayers(team_id: string) {
  try {
    return await db.query.UserTable.findMany({
      where: and(
        eq(UserTable.team_id, team_id),
        eq(UserTable.role, UserRole.PLAYER),
        eq(UserTable.state, UserState.ACTIVE),
      ),
      with: {
        player: true,
      },
    });
  } catch {
    return [];
  }
}

export async function getTeamHeadCoach(team_id: string) {
  try {
    const coach = await db
      .select({
        id: UserTable.id,
        name: UserTable.name,
      })
      .from(UserTable)
      .leftJoin(CoachTable, eq(CoachTable.id, UserTable.id))
      .where(
        and(eq(UserTable.team_id, team_id), eq(UserTable.role, UserRole.COACH)),
      );

    return coach.length > 0 ? coach[0] : null;
  } catch {
    return null;
  }
}

export async function getUserById(id: string): Promise<Nullish<User>> {
  try {
    const user = await db.query.UserTable.findFirst({
      where: eq(UserTable.id, id),
      with: {
        coach: true,
        player: true,
        // The open stint carries the dates the profile renders. Past stints
        // are read separately, via `getMemberships`.
        memberships: {
          where: isNull(UserTeamTable.leave_date),
          limit: 1,
        },
      },
    });

    if (!user) return null;

    const { memberships, ...rest } = user;
    const [current] = memberships;

    return {
      ...rest,
      join_date: current?.join_date ?? null,
      leave_date: current?.leave_date ?? null,
    };
  } catch {
    return null;
  }
}

export async function updateUser(user_id: string, user: Partial<InsertUser>) {
  return await db.update(UserTable).set(user).where(eq(UserTable.id, user_id));
}

/**
 * Update a user, their open membership stint and role rows in one transaction;
 * new rows are upserted and old ones removed so role data stays in sync.
 */
export async function updateUserTeamInfo(
  user_id: string,
  values: {
    user: Partial<InsertUser>;
    membership?: Partial<Pick<UserTeam, 'join_date' | 'leave_date'>>;
    player?: Omit<InsertPlayer, 'id'>;
    coach?: Omit<InsertCoach, 'id'>;
    remove: { player: boolean; coach: boolean };
  },
) {
  const { user, membership, player, coach, remove } = values;

  return await db.transaction(async (tx) => {
    if (player) {
      const row = { id: user_id, ...player };
      await tx
        .insert(PlayerTable)
        .values(row)
        .onConflictDoUpdate({ target: PlayerTable.id, set: row });
    }

    if (coach) {
      const row = { id: user_id, ...coach };
      await tx
        .insert(CoachTable)
        .values(row)
        .onConflictDoUpdate({ target: CoachTable.id, set: row });
    }

    await tx.update(UserTable).set(user).where(eq(UserTable.id, user_id));

    // `join_date` belongs to the open stint, not the user row
    if (membership) {
      await tx
        .update(UserTeamTable)
        .set(membership)
        .where(
          and(
            eq(UserTeamTable.user_id, user_id),
            isNull(UserTeamTable.leave_date),
          ),
        );
    }

    if (remove.player) {
      await tx.delete(PlayerTable).where(eq(PlayerTable.id, user_id));
    }

    if (remove.coach) {
      await tx.delete(CoachTable).where(eq(CoachTable.id, user_id));
    }
  });
}

export async function deleteUser(user_id: string) {
  return await db.delete(UserTable).where(eq(UserTable.id, user_id));
}
