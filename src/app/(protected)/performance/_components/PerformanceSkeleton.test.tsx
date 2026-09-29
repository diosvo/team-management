import { renderWithUI, screen } from '@/test/utilities';

import PerformanceSkeleton, {
  BodySkeleton,
  ChartSkeleton,
  HeaderSkeleton,
  StatsSkeleton,
} from './PerformanceSkeleton';

describe('PerformanceSkeleton', () => {
  test('renders a chart-sized placeholder', () => {
    const { container } = renderWithUI(<ChartSkeleton />);

    expect(container.querySelector('.chakra-skeleton')).not.toBeNull();
  });

  test('renders the known title for real', () => {
    renderWithUI(<HeaderSkeleton title="Jane Doe" />);

    const heading = screen.getByRole('heading', { name: /Jane Doe/ });
    expect(heading.closest('.chakra-skeleton')).toBeNull();
    expect(
      screen.getByText('Player name').closest('.chakra-skeleton'),
    ).not.toBeNull();
  });

  test('hides the placeholder title until it is known', () => {
    renderWithUI(<HeaderSkeleton />);

    expect(
      screen
        .getByRole('heading', { name: /My Performance/ })
        .closest('.chakra-skeleton'),
    ).not.toBeNull();
  });

  test('renders four stat cards', () => {
    const { container } = renderWithUI(<StatsSkeleton />);

    expect(container.querySelectorAll('.chakra-stat__root')).toHaveLength(4);
  });

  test('renders the whole page on the attendance tab', () => {
    renderWithUI(<PerformanceSkeleton />);

    expect(screen.getByRole('tab', { name: 'Attendance' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByText('Attendance Rate Trend')).toBeInTheDocument();
    expect(screen.getByText('Breakdown')).toBeInTheDocument();
  });

  test('renders the testing section with placeholder descriptions', () => {
    renderWithUI(<BodySkeleton tab="testing" />);

    expect(screen.getByText('Latest Results')).toBeInTheDocument();
    expect(screen.getByText('Progress Over Time')).toBeInTheDocument();
    expect(screen.getByText('Team Standing')).toBeInTheDocument();
    expect(screen.getAllByText('Loading description text')).toHaveLength(2);
  });

  test('renders the activity section with a table', () => {
    renderWithUI(<BodySkeleton tab="activity" />);

    expect(screen.getByText('Activity Log')).toBeInTheDocument();
    expect(screen.getAllByRole('row')).toHaveLength(9);
  });

  test('renders the matches section with averages and box scores', () => {
    const { container } = renderWithUI(<BodySkeleton tab="matches" />);

    expect(screen.getByText('Recent Match Statistics')).toBeInTheDocument();
    expect(screen.getByText('Box Scores')).toBeInTheDocument();
    // Four page stats plus seven averages.
    expect(container.querySelectorAll('.chakra-stat__root')).toHaveLength(11);
  });
});
