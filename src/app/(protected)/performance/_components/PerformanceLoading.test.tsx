import type { PerformanceTab } from '@/utils/constants';
import { MATCH_AVERAGE_FIELDS } from '@/utils/constants';

import { MOCK_PERFORMANCE_RANGE } from '@/test/mocks/performance';
import { mockUseQueryStates, renderWithUI, screen } from '@/test/utilities';

import PerformanceLoading from './PerformanceLoading';

describe('PerformanceLoading', () => {
  const setup = (tab: PerformanceTab = 'attendance') => {
    mockUseQueryStates({ ...MOCK_PERFORMANCE_RANGE, tab });

    return renderWithUI(<PerformanceLoading />);
  };

  test('renders the whole page on the attendance tab', () => {
    setup();

    expect(screen.getByRole('tab', { name: 'Attendance' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByText('Attendance Rate Trend')).toBeInTheDocument();
    expect(screen.getByText('Breakdown')).toBeInTheDocument();
  });

  test('renders the testing section with placeholder descriptions', () => {
    setup('testing');

    expect(screen.getByText('Latest Results')).toBeInTheDocument();
    expect(screen.getByText('Progress Over Time')).toBeInTheDocument();
    expect(screen.getByText('Team Standing')).toBeInTheDocument();
    expect(screen.getAllByText('Loading description text')).toHaveLength(2);
  });

  test('renders the activity section with a table', () => {
    setup('activity');

    expect(screen.getByText('Activity Log')).toBeInTheDocument();
    expect(screen.getAllByRole('row')).toHaveLength(9);
  });

  test('renders the matches section with averages and box scores', () => {
    const { container } = setup('matches');

    expect(screen.getByText('Recent Match Statistics')).toBeInTheDocument();
    expect(screen.getByText('Box Scores')).toBeInTheDocument();
    // Four page stats plus one tile per averaged stat.
    expect(container.querySelectorAll('.chakra-stat__root')).toHaveLength(
      4 + MATCH_AVERAGE_FIELDS.length,
    );
  });
});
