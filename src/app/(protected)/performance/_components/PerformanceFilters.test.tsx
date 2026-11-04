import {
  expectNoA11yViolations,
  mockUseQueryStates,
  renderWithUI,
  screen,
  setupTestLifecycle,
  waitFor,
} from '@/test/utilities';

import { thisYear } from '@/utils/datetime';

import PerformanceFilters from './PerformanceFilters';

const currentYear = Number(thisYear().from.slice(0, 4));

describe('PerformanceFilters', () => {
  const mockSetSearchParams = vi.fn();

  setupTestLifecycle();

  const setup = () => {
    mockUseQueryStates({ ...thisYear() }, mockSetSearchParams);

    return renderWithUI(<PerformanceFilters />);
  };

  test('should be accessible', async () => {
    const { container } = setup();

    await expectNoA11yViolations(container);
  });

  test('writes the picked window to the URL and resets the page', async () => {
    const { user } = setup();

    await user.click(screen.getByRole('button', { name: 'Time: This year' }));
    await user.click(await screen.findByRole('button', { name: 'Last year' }));

    await waitFor(() =>
      expect(mockSetSearchParams).toHaveBeenCalledWith(
        {
          from: `${currentYear - 1}-01-01`,
          to: `${currentYear - 1}-12-31`,
          page: 1,
        },
        { shallow: false },
      ),
    );
  });
});
