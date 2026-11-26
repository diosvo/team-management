import {
  and,
  asc,
  eq,
  isNotNull,
  like,
  max,
  notLike,
  type SQL,
  sql,
} from 'drizzle-orm';

import { NO_EMAIL_DOMAIN } from '@/utils/constants';
import { isPlaceholderEmail } from '@/utils/email';
import { AccountStatus } from '@/utils/enum';

import db from '@/drizzle';
import {
  AchievementTable,
  AttendanceTable,
  LeagueTeamRosterTable,
  MatchPlayerStatsTable,
  TestNoteTable,
  TestResultTable,
  TrainingSessionTable,
} from '@/drizzle/schema';
import {
  AccountTable,
  SessionTable,
  type User,
  UserTable,
  VerificationTable,
} from '@/drizzle/schema/user';

/** One row of the admin Accounts page. No PII beyond name and email. */
export type Account = Pick<
  User,
  | 'id'
  | 'name'
  | 'email'
  | 'role'
  | 'state'
  | 'createdAt'
  | 'last_sign_in_at'
  | 'last_sign_in_ip'
> & {
  status: AccountStatus;
  /** Signed-in sessions that haven't expired. */
  active_sessions: number;
  /** When the newest emailed password link expires. */
  link_expires_at: Date | null;
};

type AccountRow = Omit<Account, 'status'> & { has_password: boolean };

/**
 * Members with a real email; placeholders must never reach a mailbox. A
 * function, so importing this module builds no SQL (tests mock drizzle-orm).
 */
export const hasRealEmail = () =>
  notLike(UserTable.email, `%@${NO_EMAIL_DOMAIN}`);

/**
 * - `no_email`: added without an email; nothing can be sent yet.
 * - `activated`: has a password and can sign in.
 * - `invited`: no password yet; the emailed link still works.
 * - `link_expired`: no password and every emailed link has expired.
 */
export function toAccountStatus(
  {
    email,
    has_password,
    link_expires_at,
  }: Pick<AccountRow, 'email' | 'has_password' | 'link_expires_at'>,
  now = new Date(),
): AccountStatus {
  if (isPlaceholderEmail(email)) return AccountStatus.NO_EMAIL;
  if (has_password) return AccountStatus.ACTIVATED;
  return link_expires_at && link_expires_at > now
    ? AccountStatus.INVITED
    : AccountStatus.LINK_EXPIRED;
}

export async function selectAccounts(team_id: string): Promise<Array<Account>> {
  try {
    // Aggregates are joined, not correlated: Drizzle leaves columns
    // unqualified on a single-table select, so a correlated subquery would
    // compare the inner table with itself.
    const passwords = db
      .selectDistinct({ user_id: AccountTable.userId })
      .from(AccountTable)
      .where(
        and(
          eq(AccountTable.providerId, 'credential'),
          isNotNull(AccountTable.password),
        ),
      )
      .as('passwords');

    const sessions = db
      .select({
        user_id: SessionTable.userId,
        active:
          sql<number>`count(*) filter (where ${SessionTable.expiresAt} > now())`
            .mapWith(Number)
            .as('active'),
      })
      .from(SessionTable)
      .groupBy(SessionTable.userId)
      .as('sessions');

    // Better Auth stores reset links as `reset-password:<token>` → user id
    const links = db
      .select({
        user_id: VerificationTable.value,
        expires_at: max(VerificationTable.expiresAt).as('expires_at'),
      })
      .from(VerificationTable)
      .where(like(VerificationTable.identifier, 'reset-password:%'))
      .groupBy(VerificationTable.value)
      .as('links');

    const rows: Array<AccountRow> = await db
      .select({
        id: UserTable.id,
        name: UserTable.name,
        email: UserTable.email,
        role: UserTable.role,
        state: UserTable.state,
        createdAt: UserTable.createdAt,
        last_sign_in_at: UserTable.last_sign_in_at,
        last_sign_in_ip: UserTable.last_sign_in_ip,
        has_password: sql<boolean>`${passwords.user_id} is not null`,
        active_sessions: sql<number>`coalesce(${sessions.active}, 0)`.mapWith(
          Number,
        ),
        link_expires_at: links.expires_at,
      })
      .from(UserTable)
      .leftJoin(passwords, eq(passwords.user_id, UserTable.id))
      .leftJoin(sessions, eq(sessions.user_id, UserTable.id))
      .leftJoin(links, eq(links.user_id, UserTable.id))
      .where(eq(UserTable.team_id, team_id))
      .orderBy(asc(UserTable.name));

    const now = new Date();

    return rows.map(({ has_password, ...account }) => ({
      ...account,
      status: toAccountStatus({ ...account, has_password }, now),
    }));
  } catch {
    return [];
  }
}

/**
 * Remembers when and from where the member last signed in. Sessions can't
 * tell later: they expire and are deleted on sign-out.
 */
export async function updateLastSignIn(
  user_id: string,
  at: Date,
  ip: Nullish<string>,
) {
  return await db
    .update(UserTable)
    .set({ last_sign_in_at: at, last_sign_in_ip: ip || null })
    .where(eq(UserTable.id, user_id));
}

/** Signs a user out of every device by dropping their sessions. */
export async function deleteSessions(user_id: string) {
  return await db.delete(SessionTable).where(eq(SessionTable.userId, user_id));
}

/** Better Auth stores reset links as `reset-password:<token>` → user id. */
const passwordLinksOf = (user_id: string) =>
  and(
    like(VerificationTable.identifier, 'reset-password:%'),
    eq(VerificationTable.value, user_id),
  );

/** Voids every emailed password link, e.g. after the email changes. */
export async function deletePasswordLinks(user_id: string) {
  return await db.delete(VerificationTable).where(passwordLinksOf(user_id));
}

/** Whether the member has set a password (can sign in with email). */
export async function isPasswordSet(user_id: string): Promise<boolean> {
  const row = await db.query.AccountTable.findFirst({
    columns: { id: true },
    where: and(
      eq(AccountTable.userId, user_id),
      eq(AccountTable.providerId, 'credential'),
      isNotNull(AccountTable.password),
    ),
  });
  return row != null;
}

/**
 * Whether anything was recorded for the member: attendance, match stats,
 * test results or notes, league rosters, achievements, or sessions they
 * coached. Deleting would erase it, so such members go Inactive instead.
 */
export async function isHistoryRecorded(user_id: string): Promise<boolean> {
  const recorded = (table: SQL, column: SQL) =>
    sql`exists (select 1 from ${table} where ${column} = ${user_id})`;

  const [row] = await db
    .execute<{ has_history: boolean }>(
      sql`select (
    ${recorded(sql`${AttendanceTable}`, sql`${AttendanceTable.player_id}`)}
    or ${recorded(sql`${MatchPlayerStatsTable}`, sql`${MatchPlayerStatsTable.player_id}`)}
    or ${recorded(sql`${TestResultTable}`, sql`${TestResultTable.player_id}`)}
    or ${recorded(sql`${TestNoteTable}`, sql`${TestNoteTable.player_id}`)}
    or ${recorded(sql`${LeagueTeamRosterTable}`, sql`${LeagueTeamRosterTable.player_id}`)}
    or ${recorded(sql`${AchievementTable}`, sql`${AchievementTable.player_id}`)}
    or ${recorded(sql`${TrainingSessionTable}`, sql`${TrainingSessionTable.coach_id}`)}
  ) as has_history`,
    )
    .then(({ rows }) => rows);

  return row?.has_history === true;
}
