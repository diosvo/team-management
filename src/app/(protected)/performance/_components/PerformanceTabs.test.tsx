import {
  expectNoA11yViolations,
  mockUseQueryStates,
  renderWithUI,
  screen,
  setupTestLifecycle,
} from '@/test/utilities';
import { MOCK_PERFORMANCE_RANGE } from '@/test/mocks/performance';

import type { PerformanceTab } from '@/utils/constants';

import PerformanceTabs from './PerformanceTabs';

describe('PerformanceTabs', () => {
  const mockSetSearchParams = vi.fn();

  setupTestLifecycle();

  const setup = (
    tab: PerformanceTab = 'attendance',
    active: PerformanceTab = tab,
  ) => {
    mockUseQueryStates({ ...MOCK_PERFORMANCE_RANGE, tab }, mockSetSearchParams);

    return renderWithUI(
      <PerformanceTabs active={active}>
        <div>{active} panel</div>
      </PerformanceTabs>,
    );
  };

  test('should be accessible', async () => {
    const { container } = setup();

    await expectNoA11yViolations(container);
  });

  test('renders a trigger per tab', () => {
    setup();

    for (const name of ['Attendance', 'Testing', 'Activity', 'Matches']) {
      expect(screen.getByRole('tab', { name })).toBeInTheDocument();
    }
  });

  test('shows the section the server rendered for the open tab', () => {
    setup('activity');

    expect(screen.getByRole('tab', { name: 'Activity' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByText('activity panel')).toBeVisible();
  });

  test('shows the skeleton while a newly picked tab loads', () => {
    setup('matches', 'activity');

    expect(screen.queryByText('activity panel')).not.toBeInTheDocument();
    expect(screen.getByText('Box Scores')).toBeInTheDocument();
  });

  test('shows the URL tab skeleton without a section', () => {
    mockUseQueryStates({ ...MOCK_PERFORMANCE_RANGE, tab: 'testing' });
    renderWithUI(<PerformanceTabs />);

    expect(screen.getByText('Latest Results')).toBeInTheDocument();
  });

  test('writes the picked tab to the URL and resets the page', async () => {
    const { user } = setup();

    await user.click(screen.getByRole('tab', { name: 'Matches' }));

    expect(mockSetSearchParams).toHaveBeenCalledWith(
      { tab: 'matches', page: 1 },
      { shallow: false },
    );
  });
});
