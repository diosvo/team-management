import {
  getMostCommonAbsenceReasons,
  getPlayersAttendanceSummary,
  getTeamAttendanceHistory,
} from '@/db/analytics';

import {
  MOCK_ABSENCE_REASONS,
  MOCK_ATTENDANCE_HISTORY,
  MOCK_PLAYERS_ATTENDANCE_SUMMARY,
} from '@/test/mocks/analytics';
import { mockWithAuth } from '@/test/mocks/auth';
import { MOCK_TEAM } from '@/test/mocks/team';

import { Interval } from '@/utils/enum';

import {
  getAttendanceHistory,
  getAttendanceSummary,
  getMostAbsenceReasons,
} from './analytics';

vi.mock('./auth', () => ({
  withAuth: mockWithAuth,
}));

vi.mock('@/db/analytics', () => ({
  getTeamAttendanceHistory: vi.fn(),
  getPlayersAttendanceSummary: vi.fn(),
  getMostCommonAbsenceReasons: vi.fn(),
}));

describe('Analytics Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAttendanceHistory', () => {
    test('calls getTeamAttendanceHistory with team_id and date interval', async () => {
      vi.mocked(getTeamAttendanceHistory).mockResolvedValue(
        MOCK_ATTENDANCE_HISTORY,
      );

      const result = await getAttendanceHistory(Interval.THIS_MONTH);

      expect(getTeamAttendanceHistory).toHaveBeenCalledWith(
        MOCK_TEAM.team_id,
        Interval.THIS_MONTH,
      );
      expect(result).toEqual(MOCK_ATTENDANCE_HISTORY);
    });

    test('returns empty array when no attendance history exists', async () => {
      vi.mocked(getTeamAttendanceHistory).mockResolvedValue([]);

      const result = await getAttendanceHistory(Interval.THIS_MONTH);

      expect(result).toEqual([]);
    });

    test('propagates errors from getTeamAttendanceHistory', async () => {
      const message = 'Database error';
      const error = new Error(message);
      vi.mocked(getTeamAttendanceHistory).mockRejectedValue(error);

      await expect(getAttendanceHistory(Interval.THIS_MONTH)).rejects.toThrow(
        message,
      );
    });
  });

  describe('getAttendanceSummary', () => {
    test('calls getPlayersAttendanceSummary with team_id and date interval', async () => {
      vi.mocked(getPlayersAttendanceSummary).mockResolvedValue(
        MOCK_PLAYERS_ATTENDANCE_SUMMARY,
      );

      const result = await getAttendanceSummary(Interval.THIS_MONTH);

      expect(getPlayersAttendanceSummary).toHaveBeenCalledWith(
        MOCK_TEAM.team_id,
        Interval.THIS_MONTH,
      );
      expect(result).toEqual(MOCK_PLAYERS_ATTENDANCE_SUMMARY);
    });

    test('returns summary with top performers and need attention lists', async () => {
      vi.mocked(getPlayersAttendanceSummary).mockResolvedValue(
        MOCK_PLAYERS_ATTENDANCE_SUMMARY,
      );

      const result = await getAttendanceSummary(Interval.THIS_MONTH);

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

      const result = await getAttendanceSummary(Interval.THIS_MONTH);

      expect(result).toEqual(emptyResponse);
      expect(result.top_performers).toEqual([]);
      expect(result.need_attention).toEqual([]);
    });

    test('propagates errors from getPlayersAttendanceSummary', async () => {
      const message = 'Database connection failed';
      const error = new Error(message);
      vi.mocked(getPlayersAttendanceSummary).mockRejectedValue(error);

      await expect(getAttendanceSummary(Interval.THIS_MONTH)).rejects.toThrow(
        message,
      );
    });
  });

  describe('getMostAbsenceReasons', () => {
    test('calls getMostCommonAbsenceReasons with team_id and date interval', async () => {
      vi.mocked(getMostCommonAbsenceReasons).mockResolvedValue(
        MOCK_ABSENCE_REASONS,
      );

      const result = await getMostAbsenceReasons(Interval.THIS_MONTH);

      expect(getMostCommonAbsenceReasons).toHaveBeenCalledWith(
        MOCK_TEAM.team_id,
        Interval.THIS_MONTH,
      );
      expect(result).toEqual(MOCK_ABSENCE_REASONS);
    });

    test('returns empty array when no absence reasons exist', async () => {
      vi.mocked(getMostCommonAbsenceReasons).mockResolvedValue([]);

      const result = await getMostAbsenceReasons(Interval.THIS_MONTH);

      expect(result).toEqual([]);
    });

    test('propagates errors from getMostCommonAbsenceReasons', async () => {
      const message = 'Query timeout';
      const error = new Error(message);
      vi.mocked(getMostCommonAbsenceReasons).mockRejectedValue(error);

      await expect(getMostAbsenceReasons(Interval.THIS_MONTH)).rejects.toThrow(
        message,
      );
    });
  });
});
