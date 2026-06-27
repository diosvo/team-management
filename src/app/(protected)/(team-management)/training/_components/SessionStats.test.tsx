import { axe } from 'jest-axe';
import * as nuqs from 'nuqs';
import { Mock } from 'vitest';

import { MOCK_TRAINING_SESSION_RESPONSE } from '@/test/mocks/training-sessions';
import { renderWithUI, screen } from '@/test/utilities';

import { SessionStatus } from '@/utils/enum';

import { TrainingSessionStats } from '@/types/training-session';

import SessionStats from './SessionStats';

describe('SessionStats', () => {
  const setSearchParams = vi.fn();

  const setup = (overrides: Partial<TrainingSessionStats> = {}) => {
    (nuqs.useQueryStates as unknown as Mock).mockReturnValue([
      {},
      setSearchParams,
    ]);

    return renderWithUI(
      <SessionStats
        stats={{ ...MOCK_TRAINING_SESSION_RESPONSE.stats, ...overrides }}
      />,
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should be accessible', async () => {
    const { container } = setup();

    const result = await axe(container);
    expect(result).toHaveNoViolations();
  });

  test('renders all stat cards with their labels', () => {
    setup();

    expect(screen.getByText('Completed Sessions')).toBeInTheDocument();
    expect(screen.getByText('Average Attendance')).toBeInTheDocument();
    expect(screen.getByText('Total Hours')).toBeInTheDocument();
  });

  test('renders the stat values and units', () => {
    setup(); // completed_sessions: 1, avg_attendance: 2.5, total_hours: 4

    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('session')).toBeInTheDocument();
    expect(screen.getByText('2.5')).toBeInTheDocument();
    expect(screen.getByText('players')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('hrs')).toBeInTheDocument();
  });

  test('rounds attendance and hours to one decimal place', () => {
    setup({ avg_attendance: 2.567, total_hours: 4.04 });

    expect(screen.getByText('2.6')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  test('filters by completed sessions when the card is clicked', async () => {
    const { user } = setup();

    await user.click(screen.getByText('Completed Sessions'));

    expect(setSearchParams).toHaveBeenCalledWith(
      { page: 1, status: [SessionStatus.COMPLETED] },
      { shallow: false },
    );
  });

  test('does not filter when there are no completed sessions', async () => {
    const { user } = setup({ completed_sessions: 0 });

    await user.click(screen.getByText('Completed Sessions'));

    expect(setSearchParams).not.toHaveBeenCalled();
  });
});
