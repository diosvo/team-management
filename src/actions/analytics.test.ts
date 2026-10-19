import {
  getMostCommonAbsenceReasons,
  getPlayersAttendanceSummary,
  getTeamAttendanceHistory,
  getUpcomingMatches,
} from '@/db/analytics';
import { getMatches } from '@/db/match';

import {
  MOCK_ABSENCE_REASONS,
  MOCK_ATTENDANCE_HISTORY,
  MOCK_DATE_RANGE,
  MOCK_PLAYERS_ATTENDANCE_SUMMARY,
} from '@/test/mocks/analytics';
import { mockWithAuth, mockWithResource } from '@/test/mocks/auth';
import { MOCK_MATCH } from '@/test/mocks/match';
import { MOCK_TEAM } from '@/test/mocks/team';
import { thisYear } from '@/utils/datetime';
import { MatchResult } from '@/utils/enum';

import { getAchievements } from './achievement';

import {
  getAttendanceHistory,
  getAttendanceSummary,
  getMatchesRate,
  getMostAbsenceReasons,
  getOverviewStats,
} from './analytics';
import { getActivePlayers } from './user';

vi.mock('./auth', () => ({
  withAuth: mockWithAuth,
  withResource: mockWithResource,
}));

vi.mock('@/db/analytics', () => ({
  getTeamAttendanceHistory: vi.fn(),
  getPlayersAttendanceSummary: vi.fn(),
  getMostCommonAbsenceReasons: vi.fn(),
  getUpcomingMatches: vi.fn(),
  getUpcomingSessions: vi.fn(),
}));

vi.mock('@/db/match', () => ({ getMatches: vi.fn() }));
vi.mock('./achievement', () => ({ getAchievements: vi.fn() }));
vi.mock('./user', () => ({ getActivePlayers: vi.fn() }));

/** The query both the overview stats and the matches-rate chart run. */
const gameMatchesQuery = ({ from, to }: { from: string; to: string }) => ({
  team_id: MOCK_TEAM.team_id,
  game_type: ['true'],
  from,
  to,
  match_type: [],
  status: [],
  page: 1,
  q: '',
});

type GameMatch = Awaited<ReturnType<typeof getMatches>>['data'][number];

const matchesResponse = (
  data: Array<Partial<GameMatch>>,
  avg_win_rate = 0,
) =>
  ({
    data: data.map((match) => ({ ...MOCK_MATCH, ...match })),
    stats: { avg_win_rate },
  }) as unknown as Awaited<ReturnType<typeof getMatches>>;

describe('Analytics Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAttendanceHistory', () => {
    test('calls getTeamAttendanceHistory with team_id and the date range', async () => {
      vi.mocked(getTeamAttendanceHistory).mockResolvedValue(
        MOCK_ATTENDANCE_HISTORY,
      );

      const result = await getAttendanceHistory(MOCK_DATE_RANGE);

      expect(getTeamAttendanceHistory).toHaveBeenCalledWith(
        MOCK_TEAM.team_id,
        MOCK_DATE_RANGE,
      );
      expect(result).toEqual(MOCK_ATTENDANCE_HISTORY);
    });

    test('returns empty array when no attendance history exists', async () => {
      vi.mocked(getTeamAttendanceHistory).mockResolvedValue([]);

      const result = await getAttendanceHistory(MOCK_DATE_RANGE);

      expect(result).toEqual([]);
    });

    test('propagates errors from getTeamAttendanceHistory', async () => {
      const message = 'Database error';
      const error = new Error(message);
      vi.mocked(getTeamAttendanceHistory).mockRejectedValue(error);

      await expect(getAttendanceHistory(MOCK_DATE_RANGE)).rejects.toThrow(
        message,
      );
    });
  });

  describe('getAttendanceSummary', () => {
    test('calls getPlayersAttendanceSummary with team_id and the date range', async () => {
      vi.mocked(getPlayersAttendanceSummary).mockResolvedValue(
        MOCK_PLAYERS_ATTENDANCE_SUMMARY,
      );

      const result = await getAttendanceSummary(MOCK_DATE_RANGE);

      expect(getPlayersAttendanceSummary).toHaveBeenCalledWith(
        MOCK_TEAM.team_id,
        MOCK_DATE_RANGE,
      );
      expect(result).toEqual(MOCK_PLAYERS_ATTENDANCE_SUMMARY);
    });

    test('returns summary with top performers and need attention lists', async () => {
      vi.mocked(getPlayersAttendanceSummary).mockResolvedValue(
        MOCK_PLAYERS_ATTENDANCE_SUMMARY,
      );

      const result = await getAttendanceSummary(MOCK_DATE_RANGE);

      expect(result).toEqual(MOCK_PLAYERS_ATTENDANCE_SUMMARY);
      expect(result.top_performers).toHaveLength(3);
      expect(result.need_attention).toHaveLength(1);
    });

    test('returns empty lists when no attendance data exists', async () => {
      const emptyResponse = {
        top_performers: [],
        need_attention: [],
      };
      vi.mocked(getPlayersAttendanceSummary).mockResolvedValue(emptyResponse);

      const result = await getAttendanceSummary(MOCK_DATE_RANGE);

      expect(result).toEqual(emptyResponse);
      expect(result.top_performers).toEqual([]);
      expect(result.need_attention).toEqual([]);
    });

    test('propagates errors from getPlayersAttendanceSummary', async () => {
      const message = 'Database connection failed';
      const error = new Error(message);
      vi.mocked(getPlayersAttendanceSummary).mockRejectedValue(error);

      await expect(getAttendanceSummary(MOCK_DATE_RANGE)).rejects.toThrow(
        message,
      );
    });
  });

  describe('getMostAbsenceReasons', () => {
    test('calls getMostCommonAbsenceReasons with team_id and the date range', async () => {
      vi.mocked(getMostCommonAbsenceReasons).mockResolvedValue(
        MOCK_ABSENCE_REASONS,
      );

      const result = await getMostAbsenceReasons(MOCK_DATE_RANGE);

      expect(getMostCommonAbsenceReasons).toHaveBeenCalledWith(
        MOCK_TEAM.team_id,
        MOCK_DATE_RANGE,
      );
      expect(result).toEqual(MOCK_ABSENCE_REASONS);
    });

    test('returns empty array when no absence reasons exist', async () => {
      vi.mocked(getMostCommonAbsenceReasons).mockResolvedValue([]);

      const result = await getMostAbsenceReasons(MOCK_DATE_RANGE);

      expect(result).toEqual([]);
    });

    test('propagates errors from getMostCommonAbsenceReasons', async () => {
      const message = 'Query timeout';
      const error = new Error(message);
      vi.mocked(getMostCommonAbsenceReasons).mockRejectedValue(error);

      await expect(getMostAbsenceReasons(MOCK_DATE_RANGE)).rejects.toThrow(
        message,
      );
    });
  });

  describe('getMatchesRate', () => {
    test('queries 5x5 matches in the selected window', async () => {
      vi.mocked(getMatches).mockResolvedValue(matchesResponse([]));

      await getMatchesRate(MOCK_DATE_RANGE);

      expect(getMatches).toHaveBeenCalledWith(
        gameMatchesQuery(MOCK_DATE_RANGE),
      );
    });

    test('tallies each outcome by league and friendly', async () => {
      vi.mocked(getMatches).mockResolvedValue(
        matchesResponse([
          { result: MatchResult.WIN, league_id: 'league-1' },
          { result: MatchResult.WIN, league_id: null },
          { result: MatchResult.WIN, league_id: null },
          { result: MatchResult.DRAW, league_id: 'league-1' },
          { result: MatchResult.LOSS, league_id: null },
        ]),
      );

      await expect(getMatchesRate(MOCK_DATE_RANGE)).resolves.toEqual([
        { outcome: 'win', league: 1, friendly: 2 },
        { outcome: 'draw', league: 1, friendly: 0 },
        { outcome: 'lose', league: 0, friendly: 1 },
      ]);
    });

    test('leaves out matches that have not been played', async () => {
      vi.mocked(getMatches).mockResolvedValue(
        matchesResponse([
          { result: MatchResult.WIN, league_id: null },
          // Scheduled and cancelled fixtures carry no result.
          { result: null, league_id: 'league-1' },
          { result: null, league_id: null },
        ]),
      );

      await expect(getMatchesRate(MOCK_DATE_RANGE)).resolves.toEqual([
        { outcome: 'win', league: 0, friendly: 1 },
        { outcome: 'draw', league: 0, friendly: 0 },
        { outcome: 'lose', league: 0, friendly: 0 },
      ]);
    });
  });

  describe('getOverviewStats', () => {
    test('reads the win rate year-to-date, whatever the filter', async () => {
      vi.mocked(getActivePlayers).mockResolvedValue([{}, {}, {}] as never);
      vi.mocked(getUpcomingMatches).mockResolvedValue([]);
      vi.mocked(getAchievements).mockResolvedValue([{}] as never);
      vi.mocked(getMatches).mockResolvedValue(matchesResponse([], 75));

      await expect(getOverviewStats()).resolves.toEqual({
        active_players: 3,
        next_game: null,
        win_rate: 75,
        achievements: 1,
      });
      expect(getMatches).toHaveBeenCalledWith(gameMatchesQuery(thisYear()));
    });
  });
});
