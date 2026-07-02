import { act } from 'react';

import { axe } from 'jest-axe';

import { fireEvent, renderWithUI, screen, waitFor } from '@/test/utilities';

import type { FilterDef } from '@/types/filters.d';
import { Interval } from '@/utils/enum';

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

const DATE_FILTER: FilterDef = {
  key: 'date',
  label: 'Date',
  control: { type: 'date' },
};

const INTERVAL_FILTER: FilterDef = {
  key: 'interval',
  label: 'Time',
  control: { type: 'interval' },
};

type Values = { status: Array<string>; date: string };

const defaults: Values = { status: [], date: '' };

// ---------------------------------------------------------------------------
// Query helpers
// ---------------------------------------------------------------------------

const checkbox = (name: string) => screen.getByRole('checkbox', { name });
const button = (name: RegExp) => screen.getByRole('button', { name });

const activeCheckbox = () => checkbox('Active');
const inactiveCheckbox = () => checkbox('Inactive');

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Filters', () => {
  const onApply = vi.fn();

  const setup = (
    overrides: Partial<React.ComponentProps<typeof Filters>> = {},
  ) =>
    renderWithUI(
      <Filters
        filters={[CHECKBOX_FILTER]}
        values={{ status: [], date: '' }}
        defaults={defaults}
        onApply={onApply}
        {...overrides}
      />,
    );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should be accessible', async () => {
    const { container } = setup();

    const result = await axe(container);
    expect(result).toHaveNoViolations();
  });

  describe('search input', () => {
    test('renders by default', () => {
      setup();

      expect(screen.getByTestId('search-input')).toBeInTheDocument();
    });

    test('is hidden when searchable={false}', () => {
      setup({ searchable: false });

      expect(screen.queryByTestId('search-input')).not.toBeInTheDocument();
    });
  });

  describe('inline interval filter', () => {
    const intervalValues = {
      status: [],
      date: '',
      interval: Interval.THIS_MONTH,
    } as unknown as Values;

    test('renders a combobox (TimePicker) for an interval filter', () => {
      setup({
        filters: [INTERVAL_FILTER],
        values: intervalValues,
        defaults: intervalValues,
      });

      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    test('calls onApply with the selected interval value', async () => {
      const { user } = setup({
        filters: [INTERVAL_FILTER],
        values: intervalValues,
        defaults: intervalValues,
      });

      await user.click(screen.getByRole('combobox'));
      await user.click(
        await screen.findByRole('option', { name: 'Last year' }),
      );

      expect(onApply).toHaveBeenCalledWith({ interval: Interval.LAST_YEAR });
    });
  });

  describe('inline date filter', () => {
    test('renders a date input', () => {
      setup({ filters: [DATE_FILTER], values: { status: [], date: '' } });

      expect(screen.getByLabelText('Date')).toBeInTheDocument();
    });

    test('calls onApply when the date changes', async () => {
      const { user } = setup({
        filters: [DATE_FILTER],
        values: { status: [], date: '' },
      });

      await user.type(screen.getByLabelText('Date'), '2025-06-01');

      expect(onApply).toHaveBeenCalled();
    });
  });

  describe('Filters button', () => {
    test('renders when categorical filters are defined', () => {
      setup();

      expect(button(/filters/i)).toBeInTheDocument();
    });

    test('is absent when there are no categorical filters', () => {
      setup({ filters: [DATE_FILTER] });

      expect(
        screen.queryByRole('button', { name: /^filters$/i }),
      ).not.toBeInTheDocument();
    });

    test('shows an active-count badge when values differ from defaults', () => {
      setup({ values: { status: ['active'], date: '' } });

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
      const { user } = setup({ values: { status: ['active'], date: '' } });

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
      const { user } = setup({ values: { status: ['active'], date: '' } });

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
            values={{ status: ['active'], date: '' }}
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

  describe('actions slot', () => {
    test('renders right-aligned action content', () => {
      setup({ actions: <button>Export</button> });

      expect(
        screen.getByRole('button', { name: 'Export' }),
      ).toBeInTheDocument();
    });
  });
});
