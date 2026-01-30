import { Coach, Player, User } from '@/drizzle/schema';
import { AddUserValues } from '@/schemas/user';
import {
  CoachPosition,
  PlayerPosition,
  UserRole,
  UserState,
} from '@/utils/enum';

import { MOCK_TEAM } from './team';

export const MOCK_USER_INPUT: Omit<AddUserValues, 'role'> = {
  name: 'Dios Vo',
  email: 'vtmn1212@gmail.com',
  dob: '12/12/1999',
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

export const MOCK_USER_WITH_PLAYER = {
  ...MOCK_USER,
  player: MOCK_PLAYER,
};

export const MOCK_USER_WITH_COACH = {
  ...MOCK_USER,
  coach: MOCK_COACH,
};
