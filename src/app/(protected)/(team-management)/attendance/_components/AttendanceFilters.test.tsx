import {
  expectNoA11yViolations,
  mockUseQueryStates,
  renderWithUI,
  screen,
  setupTestLifecycle,
} from '@/test/utilities';
import { AttendanceStatus } from '@/utils/enum';

import AttendanceFilters from './AttendanceFilters';

describe('AttendanceFilters', () => {
  const setSearchParams = vi.fn();

  const setup = (overrides: Record<string, unknown> = {}) => {
    const state = {
      q: '',
      date: '2026-02-01',
      status: [],
      page: 1,
      ...overrides,
    };
    mockUseQueryStates(state, setSearchParams);

    const view = renderWithUI(<AttendanceFilters />);
    const dateInput = view.container.querySelector(
      'input[type="date"]',
    ) as HTMLInputElement;

    return { ...view, dateInput };
  };

  setupTestLifecycle();

  test('should be accessible', async () => {
    const { container } = setup();

    await expectNoA11yViolations(container);
  });

  test('renders the search input', () => {
    setup();

    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
  });

  test('renders the date picker with the committed value', () => {
    const date = '2026-03-15';
    const { dateInput } = setup({ date });

    expect(dateInput).toBeInTheDocument();
    expect(dateInput.value).toBe(date);
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
