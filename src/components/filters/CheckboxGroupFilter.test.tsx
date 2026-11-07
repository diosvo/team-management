import {
  MOCK_ACTIVE_OPTION,
  MOCK_INACTIVE_OPTION,
  MOCK_STATUS_OPTIONS,
} from '@/test/mocks/filters';
import {
  expectNoA11yViolations,
  renderWithUI,
  screen,
  setupTestLifecycle,
  waitForStable,
} from '@/test/utilities';

import CheckboxGroupFilter from './CheckboxGroupFilter';

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
        options={MOCK_STATUS_OPTIONS}
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
      screen.getByRole('checkbox', { name: MOCK_ACTIVE_OPTION.label }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('checkbox', { name: MOCK_INACTIVE_OPTION.label }),
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
      await setup({ value: [MOCK_ACTIVE_OPTION.value] });

      expect(screen.getByText('clear')).toBeVisible();
    });

    test('calls onChange with an empty array when clicked', async () => {
      const { user } = await setup({ value: [MOCK_ACTIVE_OPTION.value] });

      await user.click(screen.getByText('clear'));

      expect(onChange).toHaveBeenCalledWith([]);
    });
  });

  describe('checkbox interaction', () => {
    test('pre-checks the checkboxes that match the current value', async () => {
      await setup({ value: [MOCK_ACTIVE_OPTION.value] });

      expect(
        screen.getByRole('checkbox', { name: MOCK_ACTIVE_OPTION.label }),
      ).toBeChecked();
      expect(
        screen.getByRole('checkbox', { name: MOCK_INACTIVE_OPTION.label }),
      ).not.toBeChecked();
    });

    test('calls onChange when a checkbox is checked', async () => {
      const { user } = await setup({ value: [] });

      await user.click(
        screen.getByRole('checkbox', { name: MOCK_ACTIVE_OPTION.label }),
      );

      expect(onChange).toHaveBeenCalledWith([MOCK_ACTIVE_OPTION.value]);
    });

    test('calls onChange with remaining values when a checked box is unchecked', async () => {
      const { user } = await setup({
        value: [MOCK_ACTIVE_OPTION.value, MOCK_INACTIVE_OPTION.value],
      });

      await user.click(
        screen.getByRole('checkbox', { name: MOCK_ACTIVE_OPTION.label }),
      );

      expect(onChange).toHaveBeenCalledWith([MOCK_INACTIVE_OPTION.value]);
    });
  });

  describe('layout', () => {
    const verifyOptionsRendered = (options: Array<{ label: string }>) => {
      options.forEach(({ label: name }) => {
        expect(screen.getByRole('checkbox', { name })).toBeInTheDocument();
      });
    };

    test('renders all options when 3 or fewer are provided (horizontal layout)', async () => {
      await setup({ options: MOCK_STATUS_OPTIONS });

      verifyOptionsRendered(MOCK_STATUS_OPTIONS);
    });

    test('renders all options when more than 3 are provided (vertical layout)', async () => {
      await setup({ options: FOUR_OPTIONS });

      verifyOptionsRendered(FOUR_OPTIONS);
    });
  });
});
