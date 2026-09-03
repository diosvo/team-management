import { and, eq, ne } from 'drizzle-orm';

import db from '@/drizzle';
import {
  CoachTable,
  type Player,
  type User,
  UserTable,
} from '@/drizzle/schema';

import { UserRole, UserState } from '@/utils/enum';

/**
 * The subset of the user row the roster table renders. The full row carries
 * PII (dob, phone, citizen id) that must not cross the RSC boundary.
 */
export type RosterUser = Pick<
  User,
  'id' | 'name' | 'email' | 'state' | 'role' | 'emailVerified'
> & {
  player?: Nullish<Pick<Player, 'jersey_number' | 'position'>>;
};

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
    return await db.query.UserTable.findFirst({
      where: eq(UserTable.id, id),
      with: {
        coach: true,
        player: true,
      },
    });
  } catch {
    return null;
  }
}

export async function updateUser(user_id: string, user: Partial<User>) {
  return await db.update(UserTable).set(user).where(eq(UserTable.id, user_id));
}

export async function deleteUser(user_id: string) {
  return await db.delete(UserTable).where(eq(UserTable.id, user_id));
}
