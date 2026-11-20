import { AccountStatus, UserRole, UserState } from '@/utils/enum';

import type { Account } from '@/db/account';

import { MOCK_USER } from './user';

export const MOCK_ACCOUNT: Account = {
  id: 'user-456',
  name: 'Linh Tran',
  email: 'linh@example.com',
  role: UserRole.PLAYER,
  state: UserState.ACTIVE,
  createdAt: new Date('2026-01-15T00:00:00Z'),
  status: AccountStatus.ACTIVATED,
  active_sessions: 2,
  last_sign_in_at: new Date('2026-11-19T08:30:00Z'),
  last_sign_in_ip: '203.0.113.7',
  link_expires_at: null,
};

export const MOCK_INVITED_ACCOUNT: Account = {
  ...MOCK_ACCOUNT,
  id: 'user-789',
  name: 'Minh Pham',
  email: 'minh@example.com',
  role: UserRole.COACH,
  status: AccountStatus.INVITED,
  active_sessions: 0,
  last_sign_in_at: null,
  last_sign_in_ip: null,
  link_expires_at: new Date('2026-11-20T10:00:00Z'),
};

export const MOCK_EXPIRED_ACCOUNT: Account = {
  ...MOCK_INVITED_ACCOUNT,
  id: 'user-999',
  name: 'Quang Le',
  email: 'quang@example.com',
  role: UserRole.PLAYER,
  status: AccountStatus.LINK_EXPIRED,
  link_expires_at: new Date('2026-11-01T10:00:00Z'),
};

/** The signed-in admin's own row. */
export const MOCK_OWN_ACCOUNT: Account = {
  ...MOCK_ACCOUNT,
  id: MOCK_USER.id,
  name: MOCK_USER.name,
  email: MOCK_USER.email,
  role: UserRole.SUPER_ADMIN,
};
