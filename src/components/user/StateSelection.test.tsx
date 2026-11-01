import { useForm } from 'react-hook-form';

import {
  act,
  cleanup,
  expectNoA11yViolations,
  fireEvent,
  renderWithUI,
  screen,
  waitFor,
} from '@/test/utilities';

import { UserState } from '@/utils/enum';
import { ControlledStateSelection, StateSelection } from './StateSelection';

// Unmount before the global rAF mock drops pending frames: zag clears a closed
// layer two frames later, and a stale one swallows every later outside interaction.
afterEach(async () => {
  cleanup();
  await new Promise((resolve) => setTimeout(resolve, 10));
});

/**
 * Move focus outside the open dropdown. Zag attaches its outside listeners a
 * frame after opening and defers the focus check by another, so wait one out
 * and then run frames inline to fire `onInteractOutside`.
 */
const focusOutside = async () => {
  await act(
    () => new Promise((resolve) => requestAnimationFrame(() => resolve(null))),
  );
  const outside = document.createElement('button');
  document.body.appendChild(outside);
  const raf = vi
    .spyOn(window, 'requestAnimationFrame')
    .mockImplementation((callback) => {
      callback(performance.now());
      return 0;
    });
  try {
    act(() => {
      fireEvent(outside, new FocusEvent('focusin', { bubbles: true }));
    });
  } finally {
    raf.mockRestore();
    outside.remove();
  }
};

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

  test('has no clear button for a single selection', () => {
    setup({ defaultValue: [UserState.ACTIVE] });

    expect(
      screen.queryByRole('button', { name: /clear/i }),
    ).not.toBeInTheDocument();
  });

  test('clears every selected state when multiple', async () => {
    const onValueChange = vi.fn();
    const { user, combobox } = setup({
      multiple: true,
      defaultValue: [UserState.ACTIVE, UserState.INACTIVE],
      onValueChange,
    });

    expect(combobox).toHaveTextContent('Active, Inactive');

    await user.click(screen.getByRole('button', { name: /clear/i }));

    await waitFor(() => expect(combobox).toHaveTextContent('State'));
    expect(onValueChange).toHaveBeenCalledWith(
      expect.objectContaining({ value: [] }),
    );
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
  const {
    control,
    watch,
    formState: { touchedFields },
  } = useForm<FormValues>({
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
      <div data-testid="state-touched">{String(!!touchedFields.state)}</div>
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

    await expectNoA11yViolations(container);
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

  test('marks the field touched when focus moves away from it', async () => {
    const { user, combobox } = setup();

    await user.click(combobox);
    expect(
      await screen.findByRole('option', { name: 'Active' }),
    ).toBeInTheDocument();
    expect(screen.getByTestId('state-touched')).toHaveTextContent('false');

    await focusOutside();

    await waitFor(() =>
      expect(screen.getByTestId('state-touched')).toHaveTextContent('true'),
    );
    expect(screen.getByTestId('state-value')).toBeEmptyDOMElement();
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
