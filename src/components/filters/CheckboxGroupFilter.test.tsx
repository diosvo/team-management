import {
  expectNoA11yViolations,
  renderWithUI,
  screen,
  setupTestLifecycle,
  waitForStable,
} from '@/test/utilities';

import CheckboxGroupFilter from './CheckboxGroupFilter';

const TWO_OPTIONS = [
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
];

const FOUR_OPTIONS = [
  { label: 'On Time', value: 'on_time' },
  { label: 'Late', value: 'late' },
  { label: 'Absent', value: 'absent' },
  { label: 'Excused', value: 'excused' },
];

describe('CheckboxGroupFilter', () => {
  const onChange = vi.fn();

  // Chakra's CheckboxRoot syncs its state once on mount, so settle that update
  // inside act() before a test asserts. Otherwise it lands after the test body
  // and React logs an act() warning.
  const setup = async (
    overrides: Partial<React.ComponentProps<typeof CheckboxGroupFilter>> = {},
  ) => {
    const result = renderWithUI(
      <CheckboxGroupFilter
        label="Status"
        value={[]}
        options={TWO_OPTIONS}
        onChange={onChange}
        {...overrides}
      />,
    );

    await waitForStable();

    return result;
  };

  setupTestLifecycle();

  test('should be accessible', async () => {
    const { container } = await setup();

    await expectNoA11yViolations(container);
  });

  test('renders the group label', async () => {
    await setup();

    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  test('renders a checkbox for each option', async () => {
    await setup();

    expect(
      screen.getByRole('checkbox', { name: 'Active' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('checkbox', { name: 'Inactive' }),
    ).toBeInTheDocument();
  });

  describe('clear button', () => {
    test('is hidden when no values are selected', async () => {
      await setup({ value: [] });

      // The button lives inside a <legend>, which removes it from the ARIA
      // role tree in JSDOM; query by text and check CSS visibility instead.
      expect(screen.getByText('clear')).not.toBeVisible();
    });

    test('is visible when at least one value is selected', async () => {
      await setup({ value: ['active'] });

      expect(screen.getByText('clear')).toBeVisible();
    });

    test('calls onChange with an empty array when clicked', async () => {
      const { user } = await setup({ value: ['active'] });

      await user.click(screen.getByText('clear'));

      expect(onChange).toHaveBeenCalledWith([]);
    });
  });

  describe('checkbox interaction', () => {
    test('pre-checks the checkboxes that match the current value', async () => {
      await setup({ value: ['active'] });

      expect(screen.getByRole('checkbox', { name: 'Active' })).toBeChecked();
      expect(
        screen.getByRole('checkbox', { name: 'Inactive' }),
      ).not.toBeChecked();
    });

    test('calls onChange when a checkbox is checked', async () => {
      const { user } = await setup({ value: [] });

      await user.click(screen.getByRole('checkbox', { name: 'Active' }));

      expect(onChange).toHaveBeenCalledWith(['active']);
    });

    test('calls onChange with remaining values when a checked box is unchecked', async () => {
      const { user } = await setup({ value: ['active', 'inactive'] });

      await user.click(screen.getByRole('checkbox', { name: 'Active' }));

      expect(onChange).toHaveBeenCalledWith(['inactive']);
    });
  });

  describe('layout', () => {
    const verifyOptionsRendered = (options: Array<{ label: string }>) => {
      options.forEach(({ label: name }) => {
        expect(screen.getByRole('checkbox', { name })).toBeInTheDocument();
      });
    };

    test('renders all options when 3 or fewer are provided (horizontal layout)', async () => {
      await setup({ options: TWO_OPTIONS });

      verifyOptionsRendered(TWO_OPTIONS);
    });

    test('renders all options when more than 3 are provided (vertical layout)', async () => {
      await setup({ options: FOUR_OPTIONS });

      verifyOptionsRendered(FOUR_OPTIONS);
    });
  });
});
