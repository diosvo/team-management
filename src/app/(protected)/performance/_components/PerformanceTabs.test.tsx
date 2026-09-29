import {
  expectNoA11yViolations,
  mockUseQueryStates,
  renderWithUI,
  screen,
  setupTestLifecycle,
} from '@/test/utilities';

import type { PerformanceTab } from '@/utils/constants';

import PerformanceTabs from './PerformanceTabs';

const RANGE = { from: '2026-01-01', to: '2026-12-31' };

describe('PerformanceTabs', () => {
  const mockSetSearchParams = vi.fn();

  setupTestLifecycle();

  const setup = (tab: PerformanceTab = 'attendance') => {
    mockUseQueryStates({ ...RANGE, tab }, mockSetSearchParams);

    return renderWithUI(
      <PerformanceTabs
        attendance={<div>Attendance panel</div>}
        testing={<div>Testing panel</div>}
        activity={<div>Activity panel</div>}
        matches={<div>Matches panel</div>}
      />,
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

  test('mounts only the active panel', () => {
    setup('activity');

    expect(screen.getByRole('tab', { name: 'Activity' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByText('Activity panel')).toBeVisible();
    expect(screen.queryByText('Attendance panel')).not.toBeInTheDocument();
  });

  test('writes the picked tab to the URL and resets the page', async () => {
    const { user } = setup();

    await user.click(screen.getByRole('tab', { name: 'Matches' }));

    expect(mockSetSearchParams).toHaveBeenCalledWith({
      tab: 'matches',
      page: 1,
    });
  });
});
