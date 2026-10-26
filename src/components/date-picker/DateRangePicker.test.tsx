import { axe } from 'jest-axe';

import { renderWithUI, screen, waitFor } from '@/test/utilities';
import {
  formatDate,
  formatDateRange,
  thisDay,
  thisMonth,
  thisYear,
} from '@/utils/datetime';

import { DateRangePicker } from './DateRangePicker';

const RANGE = { from: '2026-02-01', to: '2026-02-28' };
const DAY = { from: '2026-02-01', to: '2026-02-01' };

describe('DateRangePicker', () => {
  const onChange = vi.fn();

  const setup = (
    props: Partial<React.ComponentProps<typeof DateRangePicker>> = {},
  ) =>
    renderWithUI(
      <DateRangePicker
        label="Time"
        value={RANGE}
        onChange={onChange}
        {...props}
      />,
    );

  const trigger = (name: string) =>
    screen.getByRole('button', { name: `Time: ${name}` });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should be accessible', async () => {
    const { container } = setup();

    const result = await axe(container);
    expect(result).toHaveNoViolations();
  });

  test('shows both ends of the window in the locale format', () => {
    setup();

    expect(trigger(formatDateRange(RANGE))).toHaveTextContent(
      '01/02/2026 - 28/02/2026',
    );
  });

  test('names a window that matches a preset', () => {
    setup({ value: thisYear() });

    expect(trigger('This year')).toBeInTheDocument();
  });

  test('falls back to the placeholder when either end is missing', () => {
    setup({ value: { from: '2026-02-01', to: '' } });

    expect(trigger('All time')).toBeVisible();
  });

  test('leads with a custom icon in place of the calendar', () => {
    setup({ icon: 'Acquired Date:' });

    expect(trigger(formatDateRange(RANGE))).toHaveTextContent(
      `Acquired Date:${formatDateRange(RANGE)}`,
    );
  });

  describe('clear', () => {
    test('offers no clear button without onClear', () => {
      setup();

      expect(screen.queryByRole('button', { name: 'Clear Time' })).toBeNull();
    });

    test('offers no clear button while the window is empty', () => {
      setup({ value: { from: '', to: '' }, onClear: vi.fn() });

      expect(screen.queryByRole('button', { name: 'Clear Time' })).toBeNull();
    });

    test('names the clear button generically without a label', () => {
      renderWithUI(
        <DateRangePicker value={RANGE} onChange={onChange} onClear={vi.fn()} />,
      );

      expect(
        screen.getByRole('button', { name: 'Clear dates' }),
      ).toBeInTheDocument();
    });

    test('clears a set window', async () => {
      const onClear = vi.fn();
      const { user } = setup({ onClear });

      await user.click(screen.getByRole('button', { name: 'Clear Time' }));

      expect(onClear).toHaveBeenCalledTimes(1);
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('range', () => {
    test('offers period shortcuts only', async () => {
      const { user } = setup();

      await user.click(trigger(formatDateRange(RANGE)));
      await screen.findByRole('grid');

      for (const name of ['This week', 'Last month', 'Last year']) {
        expect(screen.getByRole('button', { name })).toBeInTheDocument();
      }
      expect(screen.queryByRole('button', { name: 'Today' })).toBeNull();
    });

    test.each([
      ['This month', thisMonth()],
      ['This year', thisYear()],
    ])('emits ISO days for the %s preset', async (label, expected) => {
      const { user } = setup();

      await user.click(trigger(formatDateRange(RANGE)));
      await user.click(await screen.findByRole('button', { name: label }));

      await waitFor(() => expect(onChange).toHaveBeenCalledWith(expected));
      expect(onChange).toHaveBeenCalledTimes(1);
    });

    test('does not emit until both ends of a hand-picked range are set', async () => {
      const { user } = setup({ value: { from: '', to: '' } });

      await user.click(trigger('All time'));
      // One click only opens the range; committing here would refetch on a
      // half-open window.
      await user.click(await screen.findByRole('button', { name: /\b10\b/ }));
      expect(onChange).not.toHaveBeenCalled();

      await user.click(screen.getByRole('button', { name: /\b20\b/ }));
      await waitFor(() => expect(onChange).toHaveBeenCalledTimes(1));
      const [{ from, to }] = onChange.mock.calls[0];
      expect(from).toMatch(/-10$/);
      expect(to).toMatch(/-20$/);
    });

    test('does not re-emit the window that is already committed', async () => {
      const { user } = setup({ value: thisMonth() });

      await user.click(trigger('This month'));
      await user.click(
        await screen.findByRole('button', { name: 'This month' }),
      );

      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('single', () => {
    test('shows the committed day and offers day shortcuts only', async () => {
      const { user } = setup({ selection: 'single', value: DAY });

      await user.click(trigger(formatDate(DAY.from)));
      await screen.findByRole('grid');

      for (const name of ['Today', 'Yesterday', 'Tomorrow']) {
        expect(screen.getByRole('button', { name })).toBeInTheDocument();
      }
      expect(screen.queryByRole('button', { name: 'This month' })).toBeNull();
    });

    test('names a committed day that matches a preset', () => {
      setup({ selection: 'single', value: thisDay() });

      expect(trigger('Today')).toBeInTheDocument();
    });

    test('emits a one-day window for a preset', async () => {
      const { user } = setup({ selection: 'single', value: DAY });

      await user.click(trigger(formatDate(DAY.from)));
      await user.click(await screen.findByRole('button', { name: 'Today' }));

      await waitFor(() => expect(onChange).toHaveBeenCalledWith(thisDay()));
    });

    test('emits a one-day window for a hand-picked day', async () => {
      const { user } = setup({ selection: 'single', value: DAY });

      await user.click(trigger(formatDate(DAY.from)));
      await user.click(
        await screen.findByRole('button', { name: /15 February 2026/ }),
      );

      await waitFor(() =>
        expect(onChange).toHaveBeenCalledWith({
          from: '2026-02-15',
          to: '2026-02-15',
        }),
      );
    });
  });

  describe('vi', () => {
    const setupVi = (
      props: Partial<React.ComponentProps<typeof DateRangePicker>> = {},
    ) =>
      renderWithUI(
        <DateRangePicker
          label="Thời gian"
          value={RANGE}
          onChange={onChange}
          {...props}
        />,
        { locale: 'vi' },
      );

    const viTrigger = (name: string) =>
      screen.getByRole('button', { name: `Thời gian: ${name}` });

    test('names a preset window in Vietnamese', () => {
      setupVi({ value: thisYear() });

      expect(viTrigger('Năm nay')).toBeInTheDocument();
    });

    test('keeps the day-first dates of a hand-picked window', () => {
      setupVi();

      expect(viTrigger(formatDateRange(RANGE))).toBeInTheDocument();
    });

    test('translates the default placeholder', () => {
      setupVi({ value: { from: '', to: '' } });
      expect(viTrigger('Mọi thời gian')).toBeVisible();
    });

    test('names the clear button in Vietnamese', () => {
      setupVi({ onClear: vi.fn() });

      expect(
        screen.getByRole('button', { name: 'Xóa Thời gian' }),
      ).toBeInTheDocument();
    });

    test('offers Vietnamese shortcuts with localized day hints', async () => {
      const { user } = setupVi({ selection: 'single', value: DAY });

      await user.click(viTrigger(formatDate(DAY.from)));
      await screen.findByRole('grid');

      for (const name of ['Hôm nay', 'Hôm qua', 'Ngày mai']) {
        expect(screen.getByRole('button', { name })).toBeInTheDocument();
      }
      expect(screen.getByRole('button', { name: 'Hôm nay' })).toHaveTextContent(
        /thg/,
      );
    });

    test('emits the same ISO window for a Vietnamese preset', async () => {
      const { user } = setupVi();

      await user.click(viTrigger(formatDateRange(RANGE)));
      await user.click(
        await screen.findByRole('button', { name: 'Tháng này' }),
      );

      await waitFor(() => expect(onChange).toHaveBeenCalledWith(thisMonth()));
    });
  });
});
