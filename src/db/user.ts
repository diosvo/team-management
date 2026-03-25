import { and, eq, ne } from 'drizzle-orm';

import db from '@/drizzle';
import { CoachTable, User, UserTable } from '@/drizzle/schema';

import { UserRole, UserState } from '@/utils/enum';

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

    return coach ? coach[0] : null;
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
