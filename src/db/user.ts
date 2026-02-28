import { and, eq, ne } from 'drizzle-orm';

import db from '@/drizzle';
import { User, UserTable } from '@/drizzle/schema/user';

import { CoachTable } from '@/drizzle/schema';
import { CoachPosition, UserRole, UserState } from '@/utils/enum';

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
    return await db.query.UserTable.findFirst({
      where: and(
        eq(UserTable.team_id, team_id),
        eq(UserTable.role, UserRole.COACH),
        eq(CoachTable.position, CoachPosition.HEAD_COACH),
      ),
      with: {
        coach: true,
      },
    });
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
