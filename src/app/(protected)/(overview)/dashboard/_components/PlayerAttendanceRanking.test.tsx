import { axe } from 'jest-axe';

import {
  MOCK_PLAYER_RECORDS_NEED_ATTENTION,
  MOCK_PLAYER_RECORDS_TOP_PERFORMERS,
} from '@/test/mocks/analytics';
import { renderWithUI, screen } from '@/test/utilities';

import { PlayerSessionSummary } from '@/types/analytics';
import PlayerAttendanceRanking from './PlayerAttendanceRanking';

describe('PlayerAttendanceRanking', () => {
  const EMPTY_RECORDS: PlayerSessionSummary = {
    top_performers: [],
    need_attention: [],
  };

  const setup = (records: PlayerSessionSummary) =>
    renderWithUI(<PlayerAttendanceRanking records={records} />);

  test('should be accessible', async () => {
    const { container } = setup({
      top_performers: MOCK_PLAYER_RECORDS_TOP_PERFORMERS,
      need_attention: MOCK_PLAYER_RECORDS_NEED_ATTENTION,
    });

    expect(await axe(container)).toHaveNoViolations();
  });

  test('renders the card title and description', () => {
    setup(EMPTY_RECORDS);

    expect(screen.getByText('Player Attendance Rankings')).toBeInTheDocument();
    expect(
      screen.getByText('Stars of attendance and teammates who need a boost'),
    ).toBeInTheDocument();
  });

  test('renders the empty state when there are no records', () => {
    setup(EMPTY_RECORDS);

    expect(
      screen.getByText('No player attendance records'),
    ).toBeInTheDocument();
    expect(screen.queryByText('Attendance Stars')).not.toBeInTheDocument();
    expect(screen.queryByText('Need a Boost')).not.toBeInTheDocument();
  });

  test('renders both sections with their players when records exist', () => {
    setup({
      top_performers: MOCK_PLAYER_RECORDS_TOP_PERFORMERS,
      need_attention: MOCK_PLAYER_RECORDS_NEED_ATTENTION,
    });

    expect(screen.getByText('Attendance Stars')).toBeInTheDocument();
    expect(screen.getByText('Need a Boost')).toBeInTheDocument();

    // Top performers
    expect(screen.getByText('Player A')).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
    // Need attention
    expect(screen.getByText('Player C')).toBeInTheDocument();
    expect(screen.getByText('20%')).toBeInTheDocument();
  });

  test('renders the rank index and attended sessions for each player', () => {
    setup({
      top_performers: MOCK_PLAYER_RECORDS_TOP_PERFORMERS,
      need_attention: [],
    });

    expect(screen.getByText('1.')).toBeInTheDocument();
    expect(screen.getByText('2.')).toBeInTheDocument();
    expect(screen.getByText('5 sessions')).toBeInTheDocument();
    expect(screen.getByText('4 sessions')).toBeInTheDocument();
  });

  test('hides a section that has no players', () => {
    setup({
      top_performers: MOCK_PLAYER_RECORDS_TOP_PERFORMERS,
      need_attention: [],
    });

    expect(screen.getByText('Attendance Stars')).toBeInTheDocument();
    expect(screen.queryByText('Need a Boost')).not.toBeInTheDocument();
    expect(
      screen.queryByText('No player attendance records'),
    ).not.toBeInTheDocument();
  });
});
