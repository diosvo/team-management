import {
  expectNoA11yViolations,
  renderWithUI,
  screen,
  within,
} from '@/test/utilities';

import { Interval } from '@/utils/enum';

import TimePicker from './TimePicker';

describe('TimePicker', () => {
  const onChange = vi.fn();

  const setup = (value = '') =>
    renderWithUI(<TimePicker value={value} onChange={onChange} />);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should be accessible', async () => {
    const { container } = setup();

    await expectNoA11yViolations(container);
  });

  test('renders a combobox trigger', () => {
    setup();

    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  test('shows the "Time" placeholder when no value is selected', () => {
    setup();

    expect(screen.getByText('Time')).toBeInTheDocument();
  });

  test('shows the label of the selected interval', () => {
    setup(Interval.THIS_MONTH);

    // scope to the trigger to avoid matching the hidden <option> and the
    // listbox item rendered outside the combobox element
    expect(
      within(screen.getByRole('combobox')).getByText('This month'),
    ).toBeInTheDocument();
  });

  test('renders all interval options when opened', async () => {
    const { user } = setup();

    await user.click(screen.getByRole('combobox'));

    expect(
      await screen.findByRole('option', { name: 'This month' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('option', { name: 'Last month' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('option', { name: 'This year' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('option', { name: 'Last year' }),
    ).toBeInTheDocument();
  });

  test('calls onChange with the selected interval value', async () => {
    const { user } = setup();

    await user.click(screen.getByRole('combobox'));
    await user.click(await screen.findByRole('option', { name: 'Last year' }));

    expect(onChange).toHaveBeenCalledWith(Interval.LAST_YEAR);
  });

  test('calls onChange when switching from one interval to another', async () => {
    const { user } = setup(Interval.THIS_MONTH);

    await user.click(screen.getByRole('combobox'));
    await user.click(await screen.findByRole('option', { name: 'This year' }));

    expect(onChange).toHaveBeenCalledWith(Interval.THIS_YEAR);
  });
});
