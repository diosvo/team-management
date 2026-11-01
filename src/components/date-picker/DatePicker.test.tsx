import { format } from 'date-fns';
import { axe } from 'jest-axe';
import { useForm } from 'react-hook-form';

import { renderWithUI, screen, waitFor } from '@/test/utilities';
import { DEFAULT_DATE_FORMAT } from '@/utils/constants';

import DatePicker, { DatePickerField } from './DatePicker';
import { Field } from '../ui/field';

const TODAY = format(new Date(), DEFAULT_DATE_FORMAT);

describe('DatePicker', () => {
  const onChange = vi.fn();

  const setup = (
    props: Partial<React.ComponentProps<typeof DatePicker>> = {},
  ) =>
    renderWithUI(
      <DatePicker
        label="Date"
        value="2026-08-30"
        onChange={onChange}
        {...props}
      />,
    );

  const getInput = () => screen.getByLabelText('Date') as HTMLInputElement;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should be accessible', async () => {
    const { container } = setup();

    const result = await axe(container);
    expect(result).toHaveNoViolations();
  });

  test('displays the value in the locale format', () => {
    setup();

    expect(getInput().value).toBe('30/08/2026');
  });

  test('renders an empty input when there is no value', () => {
    setup({ value: '' });

    expect(getInput().value).toBe('');
  });

  test('takes its accessible name from a surrounding Field', () => {
    renderWithUI(
      <Field label="Join Date">
        <DatePicker value="" onChange={onChange} />
      </Field>,
    );

    expect(
      screen.getByRole('textbox', { name: 'Join Date' }),
    ).toBeInTheDocument();
  });

  test('links the field helper and error text', () => {
    renderWithUI(
      <Field
        invalid
        label="Join Date"
        helperText="When they joined."
        errorText="Join date is required."
      >
        <DatePicker value="" onChange={onChange} />
      </Field>,
    );

    const input = screen.getByRole('textbox', { name: 'Join Date' });
    expect(input).toHaveAttribute(
      'aria-describedby',
      screen.getByText('When they joined.').id,
    );
    expect(input).toHaveAttribute(
      'aria-errormessage',
      screen.getByText('Join date is required.').id,
    );
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  test('treats an undefined field value as an empty string', () => {
    const Form = () => {
      const { control } = useForm<{ date?: string }>({
        defaultValues: { date: undefined },
      });
      return <DatePickerField label="Date" control={control} name="date" />;
    };
    renderWithUI(<Form />);

    expect(getInput().value).toBe('');
  });

  test('carries the disabled state of a react-hook-form field', () => {
    const Form = () => {
      const { control } = useForm({
        defaultValues: { date: '2026-08-30' },
        disabled: true,
      });
      return <DatePickerField label="Date" control={control} name="date" />;
    };
    renderWithUI(<Form />);

    expect(getInput()).toBeDisabled();
    expect(getInput().value).toBe('30/08/2026');
  });

  test('emits an ISO day string when a locale-formatted date is typed', async () => {
    const { user } = setup({ value: '' });

    await user.type(getInput(), '01/06/2026');
    await user.tab();

    await waitFor(() => expect(onChange).toHaveBeenCalledWith('2026-06-01'));
  });

  test('emits an empty string when the value is cleared', async () => {
    const { user } = setup();

    await user.click(screen.getByRole('button', { name: /clear/i }));

    expect(onChange).toHaveBeenCalledWith('');
  });

  test('emits an ISO day string when a preset is picked', async () => {
    const { user } = setup({ value: '' });

    await user.click(screen.getByRole('button', { name: 'Open calendar' }));
    await user.click(await screen.findByRole('button', { name: 'Today' }));

    await waitFor(() => expect(onChange).toHaveBeenCalledWith(TODAY));
  });

  test('offers only day shortcuts', async () => {
    const { user } = setup();

    await user.click(screen.getByRole('button', { name: 'Open calendar' }));
    await screen.findByRole('grid');

    for (const name of ['Today', 'Yesterday', 'Tomorrow']) {
      expect(screen.getByRole('button', { name })).toBeInTheDocument();
    }
    expect(screen.queryByRole('button', { name: 'This month' })).toBeNull();
  });

  test('hides presets that fall outside the bounds', async () => {
    const { user } = setup({ value: '', max: TODAY });

    await user.click(screen.getByRole('button', { name: 'Open calendar' }));
    await screen.findByRole('grid');

    expect(screen.getByRole('button', { name: 'Today' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Yesterday' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Tomorrow' })).toBeNull();
  });

  test('omits the preset sidebar when no preset fits the bounds', async () => {
    const { user } = setup({ value: '', min: '2020-01-01', max: '2020-01-31' });

    await user.click(screen.getByRole('button', { name: 'Open calendar' }));

    await screen.findByRole('grid');
    expect(screen.queryByRole('button', { name: 'Today' })).toBeNull();
  });

  test('omits the preset sidebar when presets are disabled', async () => {
    const { user } = setup({ presets: false });

    await user.click(screen.getByRole('button', { name: 'Open calendar' }));

    await screen.findByRole('grid');
    expect(screen.queryByRole('button', { name: 'Today' })).toBeNull();
  });
});
