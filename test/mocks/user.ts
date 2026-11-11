import {
  CoachPosition,
  PlayerPosition,
  UserRole,
  UserState,
} from '@/utils/enum';

import type { Coach, Player, User, UserTeam } from '@/drizzle/schema';
import type { SessionUser } from '@/providers/session';
import type { AddUserValues } from '@/schemas/user';

import { MOCK_TEAM } from './team';

export const MOCK_USER_INPUT: Omit<AddUserValues, 'role'> = {
  name: 'Dios Vo',
  email: 'vtmn1212@gmail.com',
  dob: '1999-12-12',
  state: UserState.ACTIVE,
  join_date: '2024-02-20',
};

export const MOCK_USER: User = {
  id: 'user-123',
  email: MOCK_USER_INPUT.email,
  name: MOCK_USER_INPUT.name,
  emailVerified: true,
  image: null,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  team_id: MOCK_TEAM.team_id,
  dob: MOCK_USER_INPUT.dob,
  phone_number: null,
  citizen_identification: null,
  join_date: MOCK_USER_INPUT.join_date,
  leave_date: null,
  state: MOCK_USER_INPUT.state,
  role: UserRole.PLAYER,
};

/**
 * The user as better-auth projects it onto the session, which is what
 * `useSessionContext` hands to components.
 */
export const MOCK_SESSION_USER: SessionUser = {
  ...MOCK_USER,
  is_captain: false,
};

export const MOCK_USER_TEAM: UserTeam = {
  user_team_id: 'user-team-123',
  user_id: MOCK_USER.id,
  team_id: MOCK_TEAM.team_id,
  join_date: MOCK_USER_INPUT.join_date!,
  leave_date: null,
  created_at: new Date('2026-01-01'),
  updated_at: new Date('2026-01-01'),
};

export const MOCK_PLAYER: Player = {
  id: 'player-123',
  position: PlayerPosition.SHOOTING_GUARD,
  is_captain: false,
  height: 171,
  weight: 68,
  jersey_number: 9,
  created_at: new Date('2026-01-01'),
  updated_at: new Date('2026-01-01'),
};

export const MOCK_COACH: Coach = {
  id: 'coach-123',
  position: CoachPosition.HEAD_COACH,
  created_at: new Date('2026-01-01'),
  updated_at: new Date('2026-01-01'),
};

export const MOCK_COACH_WITH_NAME: Coach & { name: string } = {
  ...MOCK_COACH,
  name: MOCK_USER_INPUT.name,
};

export const MOCK_USER_WITH_PLAYER = {
  ...MOCK_USER,
  player: MOCK_PLAYER,
};

export const MOCK_USER_WITH_COACH = {
  ...MOCK_USER,
  coach: MOCK_COACH,
};

/**
 * Distinct teammates for list, table and picker tests that need several
 * rows. Each has its own id, name and email so rows can be told apart.
 */
export const MOCK_ALICE = {
  ...MOCK_USER,
  id: 'alice',
  name: 'Alice',
  email: 'alice@team.com',
  role: UserRole.PLAYER,
  state: UserState.ACTIVE,
  player: { ...MOCK_PLAYER, id: 'alice', jersey_number: 7 },
};

export const MOCK_BOB = {
  ...MOCK_USER,
  id: 'bob',
  name: 'Bob',
  email: 'bob@team.com',
  role: UserRole.COACH,
  state: UserState.INACTIVE,
  coach: { ...MOCK_COACH, id: 'bob' },
};

export const MOCK_CAROL = {
  ...MOCK_USER,
  id: 'carol',
  name: 'Carol',
  email: 'carol@team.com',
  role: UserRole.GUEST,
  state: UserState.ACTIVE,
};

/** An active player with no jersey number yet. */
export const MOCK_DAN = {
  ...MOCK_USER,
  id: 'dan',
  name: 'Dan',
  email: 'dan@team.com',
  role: UserRole.PLAYER,
  state: UserState.ACTIVE,
  player: { ...MOCK_PLAYER, id: 'dan', jersey_number: null },
};
