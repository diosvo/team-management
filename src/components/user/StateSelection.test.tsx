import { axe } from 'jest-axe';
import { useForm } from 'react-hook-form';

import { renderWithUI, screen, waitFor } from '@/test/utilities';

import { UserState } from '@/utils/enum';
import { ControlledStateSelection, StateSelection } from './StateSelection';

// ---------------------------------------------------------------------------
// StateSelection
// Always used inside a Field wrapper (e.g.ControlledStateSelection),
// which provides the label context required for full accessibility compliance.
// ---------------------------------------------------------------------------

describe('StateSelection', () => {
  const setup = (
    overrides: React.ComponentProps<typeof StateSelection> = {},
  ) => {
    const component = renderWithUI(<StateSelection {...overrides} />);
    const combobox = screen.getByRole('combobox');

    return { combobox, ...component };
  };

  test('renders with default placeholder', () => {
    setup();

    expect(screen.getByText('State')).toBeInTheDocument();
  });

  test('renders with custom placeholder', () => {
    const customPlaceholder = 'Pick a state';
    setup({ placeholder: customPlaceholder });

    expect(screen.getByText(customPlaceholder)).toBeInTheDocument();
  });

  test('renders all state options when opened', async () => {
    const { user, combobox } = setup();

    await user.click(combobox);

    expect(
      await screen.findByRole('option', { name: 'Active' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('option', { name: 'Inactive' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Absent' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Unknown' })).toBeInTheDocument();
  });

  test('is disabled when disabled prop is true', () => {
    const { combobox } = setup({ disabled: true });

    expect(combobox).toBeDisabled();
  });

  test('shows selected state value', async () => {
    const { user, combobox } = setup();

    await user.click(combobox);
    await user.click(await screen.findByRole('option', { name: 'Active' }));

    await waitFor(() => {
      expect(screen.getByRole('combobox')).toHaveTextContent('Active');
    });
  });
});

// ---------------------------------------------------------------------------
// ControlledStateSelection
// ---------------------------------------------------------------------------

type FormValues = { state: string };

function TestControlledStateForm({
  defaultValues = { state: '' },
  disabled = false,
  error,
}: {
  defaultValues?: Partial<FormValues>;
  disabled?: boolean;
  error?: string;
}) {
  const { control, watch } = useForm<FormValues>({
    defaultValues: { state: '', ...defaultValues },
  });
  const state = watch('state');

  return (
    <>
      <ControlledStateSelection
        control={control}
        name="state"
        disabled={disabled}
        error={error}
      />
      <div data-testid="state-value">{state}</div>
    </>
  );
}

describe('ControlledStateSelection', () => {
  const setup = (
    props: React.ComponentProps<typeof TestControlledStateForm> = {},
  ) => {
    const component = renderWithUI(<TestControlledStateForm {...props} />);
    const combobox = screen.getByRole('combobox');

    return { combobox, ...component };
  };

  test('should be accessible', async () => {
    const { container } = setup();

    const result = await axe(container);
    expect(result).toHaveNoViolations();
  });

  test('renders State field label', () => {
    setup();

    expect(
      screen.getByText('State', { selector: 'label' }),
    ).toBeInTheDocument();
  });

  test('renders with pre-selected state from default value', () => {
    const { combobox } = setup({ defaultValues: { state: UserState.ACTIVE } });

    expect(combobox).toHaveTextContent('Active');
  });

  test('updates form value when a state is selected', async () => {
    const { user, combobox } = setup();

    await user.click(combobox);
    await user.click(await screen.findByRole('option', { name: 'Active' }));

    await waitFor(() => {
      expect(screen.getByTestId('state-value')).toHaveTextContent(
        UserState.ACTIVE,
      );
    });
  });

  test('is disabled when disabled prop is true', () => {
    const { combobox } = setup({ disabled: true });

    expect(combobox).toBeDisabled();
  });

  test('displays error message when error prop is provided', () => {
    const customError = 'State is required';
    setup({ error: customError });

    expect(screen.getByText(customError)).toBeInTheDocument();
  });

  test('does not display error when error prop is absent', () => {
    setup();

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
