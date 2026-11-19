import path from 'path';

/**
 * Accounts and rows created by `src/drizzle/sql/seed_data.sql`, which
 * `global-setup.ts` loads into the e2e database before every run. Every
 * seeded account signs in with the same password.
 */
export const SEED_PASSWORD = 'Rovers@2026';

export const SEED = {
  admin: { id: 'user-001', email: 'vtmn1212@gmail.com', name: 'Dios Vo' },
  coach: {
    id: 'user-002',
    email: 'hung.nguyen@example.com',
    name: 'Nguyễn Văn Hùng',
  },
  /** Team captain, #7 point guard */
  captain: {
    id: 'user-003',
    email: 'khang.tran@example.com',
    name: 'Trần Minh Khang',
  },
  /** A regular player, no captain rights: the `player` project signs in as them. */
  player: {
    id: 'user-005',
    email: 'bao.pham@example.com',
    name: 'Phạm Quốc Bảo',
  },
  guest: {
    id: 'user-020',
    email: 'han.chau@example.com',
    name: 'Châu Ngọc Hân',
  },
  team: 'Saigon Rovers Basketball Club',
} as const;

const AUTH_DIR = path.join(__dirname, '../../playwright/.auth');

/** Saved sign-in state per role, written by `auth.ts` */
export const STORAGE_STATE = {
  admin: path.join(AUTH_DIR, 'admin.json'),
  player: path.join(AUTH_DIR, 'player.json'),
} as const;
