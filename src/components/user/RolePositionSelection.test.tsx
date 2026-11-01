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

import { PlayerPosition, UserRole } from '@/utils/enum';
import { RolePositionSelection, RoleSelection } from './RolePositionSelection';

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
// RoleSelection
//
// Note: Always used inside a Field wrapper (e.g.RolePositionSelection),
// which provides the label context required for full accessibility compliance.
// ---------------------------------------------------------------------------

describe('RoleSelection', () => {
  const setup = (
    overrides: React.ComponentProps<typeof RoleSelection> = {},
  ) => {
    const component = renderWithUI(<RoleSelection {...overrides} />);
    const combobox = screen.getByRole('combobox');

    return { combobox, ...component };
  };

  test('renders with default placeholder', () => {
    setup();
    expect(screen.getByText('Role')).toBeInTheDocument();
  });

  test('renders with custom placeholder', () => {
    const customPlaceholder = 'Pick a role';
    setup({ placeholder: customPlaceholder });

    expect(screen.getByText(customPlaceholder)).toBeInTheDocument();
  });

  test('renders all role options when opened', async () => {
    const { user, combobox } = setup();

    await user.click(combobox);

    expect(
      await screen.findByRole('option', { name: 'Player' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Coach' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Guest' })).toBeInTheDocument();
  });

  test('is disabled when disabled prop is true', () => {
    const { combobox } = setup({ disabled: true });
    expect(combobox).toBeDisabled();
  });

  test('passes contentRef to Portal when provided', () => {
    const ref = { current: null };
    setup({ contentRef: ref });
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  test('supports multiple selection mode', () => {
    setup({ multiple: true });
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// RolePositionSelection
// ---------------------------------------------------------------------------

type FormValues = {
  role: string;
  position: string;
};

function TestRolePositionForm({
  defaultValues = { role: '', position: '' },
  disabled = false,
}: {
  defaultValues?: Partial<FormValues>;
  disabled?: boolean;
}) {
  const {
    control,
    setValue,
    watch,
    formState: { touchedFields },
  } = useForm<FormValues>({
    defaultValues: { role: '', position: '', ...defaultValues },
  });
  const role = watch('role');
  const position = watch('position');

  return (
    <>
      <RolePositionSelection
        control={control}
        roleName="role"
        positionName="position"
        disabled={disabled}
        setValue={setValue}
      />
      <div data-testid="role-value">{role}</div>
      <div data-testid="position-value">{position}</div>
      <div data-testid="touched">{Object.keys(touchedFields).join(',')}</div>
    </>
  );
}

describe('RolePositionSelection', () => {
  const setup = (
    props: React.ComponentProps<typeof TestRolePositionForm> = {},
  ) => {
    const component = renderWithUI(<TestRolePositionForm {...props} />);
    const [roleTrigger, positionTrigger] = screen.getAllByRole('combobox');

    return { roleTrigger, positionTrigger, ...component };
  };

  test('should be accessible', async () => {
    const { container } = setup();

    await expectNoA11yViolations(container);
  });

  test('renders Role and Position field labels', () => {
    setup();

    expect(screen.getByText('Role', { selector: 'label' })).toBeInTheDocument();
    expect(
      screen.getByText('Position', { selector: 'label' }),
    ).toBeInTheDocument();
  });

  describe('disable Position field when', () => {
    test('no role is selected', () => {
      const { positionTrigger } = setup();
      expect(positionTrigger).toBeDisabled();
    });

    test('role GUEST is selected', async () => {
      const { user, roleTrigger } = setup();

      await user.click(roleTrigger);
      await user.click(await screen.findByRole('option', { name: 'Guest' }));

      await waitFor(() => {
        expect(screen.getByTestId('position-value')).toHaveTextContent('');

        const [, positionTrigger] = screen.getAllByRole('combobox');
        expect(positionTrigger).toBeDisabled();
      });
    });
  });

  test('shows player positions when role PLAYER is selected', async () => {
    const { user, roleTrigger } = setup();

    await user.click(roleTrigger);
    await user.click(await screen.findByRole('option', { name: 'Player' }));

    await waitFor(() => {
      const [, positionTrigger] = screen.getAllByRole('combobox');
      expect(positionTrigger).not.toBeDisabled();
    });

    const [, positionTrigger] = screen.getAllByRole('combobox');
    await user.click(positionTrigger);

    expect(
      await screen.findByRole('option', { name: /^PG/ }),
    ).toBeInTheDocument();
  });

  test('shows coach positions when role COACH is selected', async () => {
    const { user, roleTrigger } = setup();

    await user.click(roleTrigger);
    await user.click(await screen.findByRole('option', { name: 'Coach' }));

    await waitFor(() => {
      const [, positionTrigger] = screen.getAllByRole('combobox');
      expect(positionTrigger).not.toBeDisabled();
    });

    const [, positionTrigger] = screen.getAllByRole('combobox');
    await user.click(positionTrigger);

    expect(
      await screen.findByRole('option', { name: /^Head/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('option', { name: /^Assistant/ }),
    ).toBeInTheDocument();
  });

  test('updates form role value on selection', async () => {
    const { user, roleTrigger } = setup();

    await user.click(roleTrigger);
    await user.click(await screen.findByRole('option', { name: 'Player' }));

    await waitFor(() => {
      expect(screen.getByTestId('role-value')).toHaveTextContent(
        UserRole.PLAYER,
      );
    });
  });

  test('sets position to UNKNOWN when PLAYER role is selected', async () => {
    const { user, roleTrigger } = setup();

    await user.click(roleTrigger);
    await user.click(await screen.findByRole('option', { name: 'Player' }));

    await waitFor(() => {
      expect(screen.getByTestId('position-value')).toHaveTextContent(
        PlayerPosition.UNKNOWN,
      );
    });
  });

  test('clears position to undefined when GUEST role is selected', async () => {
    const { user, roleTrigger } = setup({
      defaultValues: {
        role: UserRole.PLAYER,
        position: PlayerPosition.UNKNOWN,
      },
    });

    await user.click(roleTrigger);
    await user.click(await screen.findByRole('option', { name: 'Guest' }));

    await waitFor(() => {
      expect(screen.getByTestId('position-value')).toHaveTextContent('');
    });
  });

  test('cycles through all role transitions with position updates', async () => {
    const { user, roleTrigger } = setup();

    // Player -> Coach
    await user.click(roleTrigger);
    await user.click(await screen.findByRole('option', { name: 'Player' }));

    await waitFor(() => {
      expect(screen.getByTestId('role-value')).toHaveTextContent(
        UserRole.PLAYER,
      );
    });

    // Coach
    await user.click(roleTrigger);
    await user.click(await screen.findByRole('option', { name: 'Coach' }));

    await waitFor(() => {
      expect(screen.getByTestId('role-value')).toHaveTextContent(
        UserRole.COACH,
      );
    });

    // Guest (position should clear)
    await user.click(roleTrigger);
    await user.click(await screen.findByRole('option', { name: 'Guest' }));

    await waitFor(() => {
      expect(screen.getByTestId('position-value')).toHaveTextContent('');
    });
  });

  test('both fields are disabled when disabled prop is true', () => {
    const { roleTrigger, positionTrigger } = setup({ disabled: true });

    expect(roleTrigger).toBeDisabled();
    expect(positionTrigger).toBeDisabled();
  });

  test('updates position value when manually selected', async () => {
    const { user, roleTrigger } = setup();

    await user.click(roleTrigger);
    await user.click(await screen.findByRole('option', { name: 'Player' }));

    await waitFor(() => {
      const [, positionTrigger] = screen.getAllByRole('combobox');
      expect(positionTrigger).not.toBeDisabled();
    });

    const [, positionTrigger] = screen.getAllByRole('combobox');
    await user.click(positionTrigger);
    const sgOption = await screen.findByRole('option', {
      name: /Shooting Guard/,
    });
    await user.click(sgOption);

    await waitFor(() => {
      expect(screen.getByTestId('position-value')).toHaveTextContent(
        PlayerPosition.SHOOTING_GUARD,
      );
    });
  });

  test('marks the role touched when focus moves away from it', async () => {
    const { user, roleTrigger } = setup();

    await user.click(roleTrigger);
    expect(
      await screen.findByRole('option', { name: 'Player' }),
    ).toBeInTheDocument();
    expect(screen.getByTestId('touched')).toBeEmptyDOMElement();

    await focusOutside();

    await waitFor(() =>
      expect(screen.getByTestId('touched')).toHaveTextContent('role'),
    );
    expect(screen.getByTestId('role-value')).toBeEmptyDOMElement();
  });

  test('marks the position touched when focus moves away from it', async () => {
    const { user, roleTrigger } = setup({
      defaultValues: { role: UserRole.PLAYER },
    });

    const [, positionTrigger] = screen.getAllByRole('combobox');
    await user.click(positionTrigger);
    expect(
      await screen.findByRole('option', { name: /Point Guard/ }),
    ).toBeInTheDocument();

    await focusOutside();

    await waitFor(() =>
      expect(screen.getByTestId('touched')).toHaveTextContent('position'),
    );
    expect(screen.getByTestId('touched')).not.toHaveTextContent('role');
    expect(roleTrigger).toBeEnabled();
  });
});
