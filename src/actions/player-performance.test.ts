import { forbidden, notFound } from 'next/navigation';

import { UserRole } from '@/utils/enum';

import {
  selectPlayerActivity,
  selectPlayerAttendanceOverview,
  selectPlayerHonorSummary,
  selectPlayerMatchesOverview,
  selectPlayerTestingOverview,
  selectPlayerTestingSummary,
} from '@/db/player-performance';
import { selectUserById } from '@/db/user';
import { MOCK_DATE_RANGE } from '@/test/mocks/analytics';
import {
  mockWithResource,
  mockWithResourceAction,
  resetMockAuthUser,
  setMockAuthUser,
} from '@/test/mocks/auth';
import { MOCK_USER, MOCK_USER_WITH_PLAYER } from '@/test/mocks/user';
import type { AttendanceOverview } from '@/types/performance';

import {
  getPerformanceIdentity,
  getPerformanceSummary,
  getPlayerActivity,
  getPlayerAttendance,
  getPlayerMatches,
  getPlayerTesting,
} from './player-performance';

vi.mock('./auth', () => ({
  withResource: mockWithResource,
}));

vi.mock('@/db/user', () => ({
  selectUserById: vi.fn(),
}));

vi.mock('@/db/player-performance', () => ({
  selectPlayerActivity: vi.fn(),
  selectPlayerAttendanceOverview: vi.fn(),
  selectPlayerHonorSummary: vi.fn(),
  selectPlayerMatchesOverview: vi.fn(),
  selectPlayerTestingOverview: vi.fn(),
  selectPlayerTestingSummary: vi.fn(),
}));

const OTHER_ID = 'user-456';
const MOCK_TARGET = MOCK_USER_WITH_PLAYER as unknown as Awaited<
  ReturnType<typeof selectUserById>
>;

describe('permissions', () => {
  test('scopes to the performance resource', () => {
    expect(mockWithResource).toHaveBeenCalledWith('performance');
  });

  test('every read requires the view action', () => {
    expect(mockWithResourceAction).toHaveBeenCalledTimes(6);
    mockWithResourceAction.mock.calls.forEach(([actions]) => {
      expect(actions).toEqual(['view']);
    });
  });
});

describe('Player Performance Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(selectUserById).mockResolvedValue(MOCK_TARGET);
  });

  afterEach(() => {
    resetMockAuthUser();
  });

  describe('target resolution', () => {
    test("forbids a player from opening someone else's page", async () => {
      await expect(getPerformanceIdentity(OTHER_ID)).rejects.toThrow(
        'FORBIDDEN',
      );

      expect(forbidden).toHaveBeenCalled();
      expect(selectUserById).not.toHaveBeenCalled();
    });

    test('lets an admin open any member', async () => {
      setMockAuthUser({ ...MOCK_USER, role: UserRole.SUPER_ADMIN });
      vi.mocked(selectUserById).mockResolvedValue({
        ...MOCK_TARGET,
        id: OTHER_ID,
      } as never);

      const result = await getPerformanceIdentity(OTHER_ID);

      expect(selectUserById).toHaveBeenCalledWith(OTHER_ID);
      expect(result.is_own).toBe(false);
    });

    test('throws not found for an unknown member', async () => {
      vi.mocked(selectUserById).mockResolvedValue(undefined as never);

      await expect(getPerformanceIdentity(MOCK_USER.id)).rejects.toThrow(
        'NOT_FOUND',
      );
      expect(notFound).toHaveBeenCalled();
    });
  });

  describe('getPerformanceIdentity', () => {
    test("describes the player's own page", async () => {
      const result = await getPerformanceIdentity(MOCK_USER.id);

      expect(result).toEqual({
        id: MOCK_USER.id,
        name: MOCK_USER.name,
        is_own: true,
        is_player: true,
        is_captain: MOCK_USER_WITH_PLAYER.player.is_captain,
        jersey_number: MOCK_USER_WITH_PLAYER.player.jersey_number,
        position: MOCK_USER_WITH_PLAYER.player.position,
      });
    });

    test('falls back for a member without a player profile', async () => {
      vi.mocked(selectUserById).mockResolvedValue({
        ...MOCK_USER,
        role: UserRole.COACH,
      } as never);

      const result = await getPerformanceIdentity(MOCK_USER.id);

      expect(result).toMatchObject({
        is_player: false,
        is_captain: false,
        jersey_number: null,
        position: null,
      });
    });
  });

  describe('getPerformanceSummary', () => {
    test('combines attendance, testing and honors', async () => {
      vi.mocked(selectPlayerAttendanceOverview).mockResolvedValue({
        rate: 90,
        total: 10,
        on_time: 8,
        late: 1,
        absent: 1,
        team_rate: 80,
        current_streak: 3,
        best_streak: 5,
        trend: null,
        monthly: [],
        reasons: [],
      } satisfies AttendanceOverview);
      vi.mocked(selectPlayerTestingSummary).mockResolvedValue({
        tests_taken: 4,
        last_tested: '2026-03-10',
      });
      const honors = { count: 1, latest: { type: 'mvp', year: 2026 } } as const;
      vi.mocked(selectPlayerHonorSummary).mockResolvedValue(honors);

      const result = await getPerformanceSummary(MOCK_USER.id, MOCK_DATE_RANGE);

      expect(selectPlayerAttendanceOverview).toHaveBeenCalledWith(
        MOCK_USER.id,
        MOCK_USER.team_id,
        MOCK_DATE_RANGE,
      );
      expect(selectPlayerTestingSummary).toHaveBeenCalledWith(MOCK_USER.id);
      expect(selectPlayerHonorSummary).toHaveBeenCalledWith(MOCK_USER.id);
      expect(result).toEqual({
        attendance: {
          rate: 90,
          total: 10,
          on_time: 8,
          late: 1,
          current_streak: 3,
          best_streak: 5,
        },
        tests_taken: 4,
        last_tested: '2026-03-10',
        honors,
      });
    });
  });

  describe('tab reads', () => {
    test('getPlayerAttendance reads the attendance overview', async () => {
      vi.mocked(selectPlayerAttendanceOverview).mockResolvedValue(
        'attendance' as never,
      );

      await expect(
        getPlayerAttendance(MOCK_USER.id, MOCK_DATE_RANGE),
      ).resolves.toBe('attendance');
      expect(selectPlayerAttendanceOverview).toHaveBeenCalledWith(
        MOCK_USER.id,
        MOCK_USER.team_id,
        MOCK_DATE_RANGE,
      );
    });

    test('getPlayerTesting reads the testing overview', async () => {
      vi.mocked(selectPlayerTestingOverview).mockResolvedValue(
        'testing' as never,
      );

      await expect(getPlayerTesting(MOCK_USER.id)).resolves.toBe('testing');
      expect(selectPlayerTestingOverview).toHaveBeenCalledWith(
        MOCK_USER.id,
        MOCK_USER.team_id,
      );
    });

    test('getPlayerActivity reads the activity log', async () => {
      vi.mocked(selectPlayerActivity).mockResolvedValue([]);

      await expect(
        getPlayerActivity(MOCK_USER.id, MOCK_DATE_RANGE),
      ).resolves.toEqual([]);
      expect(selectPlayerActivity).toHaveBeenCalledWith(
        MOCK_USER.id,
        MOCK_USER.team_id,
        MOCK_DATE_RANGE,
      );
    });

    test('getPlayerMatches reads the matches overview', async () => {
      vi.mocked(selectPlayerMatchesOverview).mockResolvedValue(
        'matches' as never,
      );

      await expect(
        getPlayerMatches(MOCK_USER.id, MOCK_DATE_RANGE),
      ).resolves.toBe('matches');
      expect(selectPlayerMatchesOverview).toHaveBeenCalledWith(
        MOCK_USER.id,
        MOCK_USER.team_id,
        MOCK_DATE_RANGE,
      );
    });
  });
});
