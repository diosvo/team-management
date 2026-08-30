import {
  expectNoA11yViolations,
  mockUseQueryStates,
  renderWithUI,
  screen,
  setupTestLifecycle,
} from '@/test/utilities';
import { formatDate, thisDay } from '@/utils/datetime';
import { AttendanceStatus } from '@/utils/enum';

import AttendanceFilters from './AttendanceFilters';

// A fixed past day, so the trigger shows the date rather than "Today".
const DAY = '2026-02-01';
const RANGE = { from: DAY, to: DAY };

describe('AttendanceFilters', () => {
  const setSearchParams = vi.fn();

  const setup = (overrides: Record<string, unknown> = {}) => {
    const state = {
      q: '',
      ...RANGE,
      status: [],
      page: 1,
      ...overrides,
    };
    mockUseQueryStates(state, setSearchParams);

    return renderWithUI(<AttendanceFilters />);
  };

  const trigger = () =>
    screen.getByRole('button', { name: `Date: ${formatDate(DAY)}` });

  setupTestLifecycle();

  test('should be accessible', async () => {
    const { container } = setup();

    await expectNoA11yViolations(container);
  });

  test('renders the search input', () => {
    setup();

    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
  });

  test('renders the date picker with the committed day', () => {
    setup();

    expect(trigger()).toBeInTheDocument();
  });

  test('offers day shortcuts only and writes a one-day window', async () => {
    const { user } = setup();

    await user.click(trigger());
    await screen.findByRole('grid');

    expect(screen.queryByRole('button', { name: 'Last month' })).toBeNull();

    await user.click(screen.getByRole('button', { name: 'Today' }));

    expect(setSearchParams).toHaveBeenCalledWith({ ...thisDay(), page: 1 });
  });

  test('renders the advanced filters trigger', () => {
    setup();

    expect(
      screen.getByRole('button', { name: /filters/i }),
    ).toBeInTheDocument();
  });

  test('opens the drawer and shows the status options', async () => {
    const { user } = setup();

    await user.click(screen.getByRole('button', { name: /filters/i }));

    expect(await screen.findByText('Advanced Filters')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('On Time')).toBeInTheDocument();
    expect(screen.getByText('Late')).toBeInTheDocument();
    expect(screen.getByText('Absent')).toBeInTheDocument();
  });

  test('applies the chosen status filter and resets the page', async () => {
    const { user } = setup();

    await user.click(screen.getByRole('button', { name: /filters/i }));
    await screen.findByText('Advanced Filters');

    await user.click(screen.getByText('Late'));
    await user.click(screen.getByRole('button', { name: /apply/i }));

    expect(setSearchParams).toHaveBeenCalledWith({
      status: [AttendanceStatus.LATE],
      page: 1,
    });
  });
});
