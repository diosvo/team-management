import { act } from 'react';

import {
  expectNoA11yViolations,
  fireEvent,
  renderWithUI,
  screen,
  setupTestLifecycle,
  waitFor,
} from '@/test/utilities';

import type { FilterDef } from '@/types/filters.d';
import { formatDate, formatDateRange, thisDay } from '@/utils/datetime';

import Filters from './Filters';

vi.mock('@/components/SearchInput', () => ({
  default: () => <input data-testid="search-input" placeholder="Search..." />,
}));

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const STATUS_OPTIONS = [
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
];

const CHECKBOX_FILTER: FilterDef = {
  key: 'status',
  label: 'Status',
  control: { type: 'checkbox-group', options: STATUS_OPTIONS },
};

const RANGE_FILTER: FilterDef = {
  key: 'range',
  label: 'Time',
  control: { type: 'date-range' },
};

const DAY_FILTER: FilterDef = {
  key: 'date',
  label: 'Date',
  control: { type: 'date-range', selection: 'single' },
};

type Values = { status: Array<string>; from?: string; to?: string };

const defaults: Values = { status: [] };

const RANGE = { from: '2026-02-01', to: '2026-02-28' };
const rangeValues: Values = { status: [], ...RANGE };

const checkbox = (name: string) => screen.getByRole('checkbox', { name });
const button = (name: RegExp) => screen.getByRole('button', { name });

const activeCheckbox = () => checkbox('Active');
const inactiveCheckbox = () => checkbox('Inactive');

describe('Filters', () => {
  const onApply = vi.fn();

  const setup = (
    overrides: Partial<React.ComponentProps<typeof Filters>> = {},
  ) =>
    renderWithUI(
      <Filters
        filters={[CHECKBOX_FILTER]}
        values={{ status: [] }}
        defaults={defaults}
        onApply={onApply}
        {...overrides}
      />,
    );

  setupTestLifecycle();

  test('should be accessible', async () => {
    const { container } = setup();

    await expectNoA11yViolations(container);
  });

  describe('search input', () => {
    test('renders by default', () => {
      setup();

      expect(screen.getByTestId('search-input')).toBeInTheDocument();
    });
  });

  describe('inline date-range filter', () => {
    const trigger = () =>
      screen.getByRole('button', { name: `Time: ${formatDateRange(RANGE)}` });

    test('renders the committed window on the trigger', () => {
      setup({
        filters: [RANGE_FILTER],
        values: rangeValues,
        defaults: rangeValues,
      });

      expect(trigger()).toBeInTheDocument();
    });

    test('calls onApply with the from/to pair of the chosen preset', async () => {
      const { user } = setup({
        filters: [RANGE_FILTER],
        values: rangeValues,
        defaults: rangeValues,
      });

      await user.click(trigger());
      await user.click(
        await screen.findByRole('button', { name: 'Last year' }),
      );

      await waitFor(() =>
        expect(onApply).toHaveBeenCalledWith({
          from: '2025-01-01',
          to: '2025-12-31',
        }),
      );
    });
  });

  describe('optional date range', () => {
    // No default window (e.g. an asset's acquired date): the range is optional.
    const optionalDefaults: Values = { status: [], from: '', to: '' };
    const clear = () => screen.queryByRole('button', { name: 'Clear Time' });

    test('offers a clear button that applies an empty window', async () => {
      const { user } = setup({
        filters: [RANGE_FILTER],
        values: rangeValues,
        defaults: optionalDefaults,
      });

      await user.click(clear()!);

      expect(onApply).toHaveBeenCalledWith({ from: '', to: '' });
    });

    test('shows "All time" and no clear button while empty', () => {
      setup({
        filters: [RANGE_FILTER],
        values: optionalDefaults,
        defaults: optionalDefaults,
      });

      expect(
        screen.getByRole('button', { name: 'Time: All time' }),
      ).toBeInTheDocument();
      expect(clear()).toBeNull();
    });

    test('offers no clear button when the range has a default window', () => {
      setup({
        filters: [RANGE_FILTER],
        values: rangeValues,
        defaults: rangeValues,
      });

      expect(clear()).toBeNull();
    });

    test('passes a custom icon through to the trigger', () => {
      setup({
        filters: [
          {
            ...RANGE_FILTER,
            control: { type: 'date-range', icon: 'Acquired Date:' },
          },
        ],
        values: rangeValues,
        defaults: rangeValues,
      });

      expect(
        screen.getByRole('button', { name: `Time: ${formatDateRange(RANGE)}` }),
      ).toHaveTextContent(`Acquired Date:${formatDateRange(RANGE)}`);
    });
  });

  describe('inline date filter', () => {
    const DAY = '2026-02-01';
    const dayValues: Values = { status: [], from: DAY, to: DAY };

    test('renders the committed day on the trigger', () => {
      setup({ filters: [DAY_FILTER], values: dayValues, defaults: dayValues });

      expect(
        screen.getByRole('button', { name: `Date: ${formatDate(DAY)}` }),
      ).toBeInTheDocument();
    });

    test('calls onApply with a one-day from/to pair', async () => {
      const { user } = setup({
        filters: [DAY_FILTER],
        values: dayValues,
        defaults: dayValues,
      });

      await user.click(
        screen.getByRole('button', { name: `Date: ${formatDate(DAY)}` }),
      );
      await user.click(await screen.findByRole('button', { name: 'Today' }));

      await waitFor(() => expect(onApply).toHaveBeenCalledWith(thisDay()));
    });
  });

  describe('Filters button', () => {
    test('renders when categorical filters are defined', () => {
      setup();

      expect(button(/filters/i)).toBeInTheDocument();
    });

    test('is absent when there are no categorical filters', () => {
      setup({ filters: [RANGE_FILTER], values: rangeValues });

      expect(
        screen.queryByRole('button', { name: /^filters$/i }),
      ).not.toBeInTheDocument();
    });

    test('shows an active-count badge when values differ from defaults', () => {
      setup({ values: { status: ['active'] } });

      expect(screen.getByText('1')).toBeInTheDocument();
    });

    test('shows no badge when values match defaults', () => {
      setup();

      expect(screen.queryByText('1')).not.toBeInTheDocument();
    });
  });

  describe('drawer', () => {
    const openDrawer = async (
      user: ReturnType<typeof renderWithUI>['user'],
    ) => {
      await user.click(button(/filters/i));
      await screen.findByText('Advanced Filters');
    };

    test('opens when the Filters button is clicked', async () => {
      const { user } = setup();

      await openDrawer(user);

      expect(screen.getByText('Advanced Filters')).toBeInTheDocument();
    });

    test('shows checkbox options for each categorical filter', async () => {
      const { user } = setup();

      await openDrawer(user);

      expect(activeCheckbox()).toBeInTheDocument();
      expect(inactiveCheckbox()).toBeInTheDocument();
    });

    test('reflects committed values as pre-checked on open', async () => {
      const { user } = setup({ values: { status: ['active'] } });

      await openDrawer(user);

      expect(activeCheckbox()).toBeChecked();
      expect(inactiveCheckbox()).not.toBeChecked();
    });

    test('calls onApply with selected values when Apply is clicked', async () => {
      const { user } = setup();

      await openDrawer(user);
      await user.click(activeCheckbox());
      await user.click(button(/apply/i));

      expect(onApply).toHaveBeenCalledWith({ status: ['active'] });
    });

    test('Reset all resets draft to defaults and calls onApply with empty arrays', async () => {
      const { user } = setup({ values: { status: ['active'] } });

      await openDrawer(user);
      await user.click(button(/reset all/i));
      await user.click(button(/apply/i));

      expect(onApply).toHaveBeenCalledWith({ status: [] });
    });

    test('preserves in-progress selections when closed via the Close button', async () => {
      const { user } = setup();

      await openDrawer(user);
      await user.click(activeCheckbox());

      // Close via the X button (does NOT trigger onInteractOutside)
      await user.click(button(/close/i));

      // Reopen – draft retains the in-progress selection (not yet applied)
      await openDrawer(user);

      expect(activeCheckbox()).toBeChecked();
    });

    test('discards in-progress selections when interacting outside the drawer', async () => {
      const { user } = setup();

      await openDrawer(user);
      await user.click(activeCheckbox());

      // Click the backdrop to trigger onInteractOutside. The backdrop carries
      // `pointer-events: none` while the modal is open, so this uses a user
      // with the pointer-events guard disabled.
      const backdrop = document.querySelector(
        '[data-scope="dialog"][data-part="backdrop"]',
      );
      fireEvent.pointerDown(backdrop as Element);

      await waitFor(() =>
        expect(screen.queryByText('Advanced Filters')).not.toBeInTheDocument(),
      );

      // Reopen – draft must have reverted to the committed (empty) state
      await openDrawer(user);

      expect(activeCheckbox()).not.toBeChecked();
    });

    test('syncs checkboxes when values change externally (e.g. stat card click)', async () => {
      const { user, rerender } = setup();

      await openDrawer(user);
      expect(activeCheckbox()).not.toBeChecked();

      // Close the drawer
      await user.click(button(/close/i));

      // Simulate an external URL update (stat card sets status=['active'])
      await act(async () => {
        rerender(
          <Filters
            filters={[CHECKBOX_FILTER]}
            values={{ status: ['active'] }}
            defaults={defaults}
            onApply={onApply}
          />,
        );
      });

      // Re-open – drawer must reflect the externally-updated committed value
      await openDrawer(user);

      expect(activeCheckbox()).toBeChecked();
    });
  });

  describe('layout', () => {
    // The search sits in a wrapper; its siblings are the other toolbar slots.
    const toolbarSlots = () =>
      screen.getByTestId('search-input').parentElement!.parentElement!.children;

    test('adds no empty controls row when there is only a search', () => {
      setup({ filters: [] });

      // Only the search: no empty row taking an extra gap after it.
      expect(toolbarSlots()).toHaveLength(1);
    });

    test('groups the date window, Filters button and actions in one row', () => {
      setup({
        filters: [RANGE_FILTER, CHECKBOX_FILTER],
        values: rangeValues,
        actions: <button type="button">Export</button>,
      });

      expect(toolbarSlots()).toHaveLength(2);
      const row = toolbarSlots()[1];
      expect(row).toContainElement(button(/Time:/));
      expect(row).toContainElement(button(/Filters/));
      expect(row).toContainElement(button(/Export/));
    });
  });

  describe('actions slot', () => {
    test('renders right-aligned action content', () => {
      setup({ actions: <button>Export</button> });

      expect(
        screen.getByRole('button', { name: 'Export' }),
      ).toBeInTheDocument();
    });
  });
});
