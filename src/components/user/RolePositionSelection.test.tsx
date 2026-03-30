import { axe } from 'jest-axe';
import { useForm } from 'react-hook-form';

import { renderWithUI, screen, waitFor } from '@/test/utilities';

import { PlayerPosition, UserRole } from '@/utils/enum';
import { RolePositionSelection, RoleSelection } from './RolePositionSelection';

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
  const { control, setValue, watch } = useForm<FormValues>({
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

    const result = await axe(container);
    expect(result).toHaveNoViolations();
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

  test('both fields are disabled when disabled prop is true', () => {
    const { roleTrigger, positionTrigger } = setup({ disabled: true });

    expect(roleTrigger).toBeDisabled();
    expect(positionTrigger).toBeDisabled();
  });
});
