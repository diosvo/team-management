import { formatDate } from '@/utils/datetime';
import { UserRole, UserState } from '@/utils/enum';

import { updateTeamInfo } from '@/actions/user';
import usePermissions from '@/hooks/use-permissions';
import {
  MOCK_PLAYER,
  MOCK_USER,
  MOCK_USER_WITH_COACH,
  MOCK_USER_WITH_PLAYER,
} from '@/test/mocks/user';
import {
  createPermissionsMock,
  createToasterMock,
  enumText,
  expectNoA11yViolations,
  renderWithUI,
  screen,
  setupTestLifecycle,
  waitFor,
} from '@/test/utilities';

import TeamInfo from './TeamInfo';

const { mockMutate } = vi.hoisted(() => ({ mockMutate: vi.fn() }));

vi.mock('@/actions/user', () => ({
  updateTeamInfo: vi.fn(),
}));

vi.mock('@/hooks/use-permissions', () => ({
  default: vi.fn(),
}));

vi.mock('swr', async (importOriginal) => {
  const actual = await importOriginal<typeof import('swr')>();
  return {
    ...actual,
    useSWRConfig: () => ({ mutate: mockMutate }),
  };
});

vi.mock('@/components/ui/toaster', () => createToasterMock());

describe('TeamInfo', () => {
  setupTestLifecycle();

  const mockUpdateTeamInfo = vi.mocked(updateTeamInfo);
  const mockUsePermissions = vi.mocked(usePermissions);

  const setup = ({
    viewOnly = false,
    isAdmin = false,
    isPlayer = true,
    isCoach = false,
  } = {}) => {
    mockUsePermissions.mockReturnValue(
      createPermissionsMock({ isAdmin, isPlayer, isCoach }),
    );

    return renderWithUI(
      <TeamInfo user={MOCK_USER_WITH_PLAYER} viewOnly={viewOnly} />,
    );
  };

  const enterEditMode = async (user: ReturnType<typeof setup>['user']) => {
    await user.click(screen.getByRole('button'));
    // The picker shows the locale format, not the stored ISO day.
    return screen.findByDisplayValue(
      formatDate(MOCK_USER_WITH_PLAYER.join_date),
    );
  };

  test('should be accessible', async () => {
    const { container } = setup();

    await expectNoA11yViolations(container);
  });

  test('renders the stored team details for a player', async () => {
    setup();

    await waitFor(() => {
      expect(
        screen.getByText(formatDate(MOCK_USER_WITH_PLAYER.join_date)),
      ).toBeInTheDocument();
    });
    // Role, position, state and jersey number live in the header.
    for (const label of ['Role', 'Position', 'State', 'Number']) {
      expect(screen.queryByText(label)).not.toBeInTheDocument();
    }
    expect(
      screen.queryByText(`#${MOCK_PLAYER.jersey_number}`),
    ).not.toBeInTheDocument();
    // Jersey details, which prefill the jersey order form, sit in their own
    // section under a labelled rule.
    const section = screen
      .getByRole('heading', { name: 'Jersey' })
      .closest('section')!;
    expect(section).toHaveTextContent(MOCK_PLAYER.jersey_name!);
    expect(screen.getByText(MOCK_PLAYER.shirt_size!)).toBeInTheDocument();
    expect(screen.getByText(MOCK_PLAYER.short_size!)).toBeInTheDocument();
    expect(
      screen.getByText(enumText('shortForm', MOCK_PLAYER.short_form!)),
    ).toBeInTheDocument();
    expect(screen.queryByText('Not provided')).not.toBeInTheDocument();
  });

  test('marks every kit detail of a player without one as not provided', async () => {
    mockUsePermissions.mockReturnValue(
      createPermissionsMock({ isPlayer: true }),
    );
    renderWithUI(
      <TeamInfo
        user={{
          ...MOCK_USER_WITH_PLAYER,
          player: {
            ...MOCK_PLAYER,
            jersey_number: null,
            jersey_name: '',
            shirt_size: null,
            short_size: null,
            short_form: null,
          },
        }}
        viewOnly={false}
      />,
    );

    await waitFor(() => {
      expect(screen.getAllByText('Not provided')).toHaveLength(4);
    });
  });

  test('marks the kit as not provided when the player row is missing', async () => {
    mockUsePermissions.mockReturnValue(
      createPermissionsMock({ isPlayer: true }),
    );
    // A player whose `player` row has not been created yet.
    renderWithUI(<TeamInfo user={MOCK_USER} viewOnly={false} />);

    await waitFor(() => {
      expect(screen.getAllByText('Not provided')).toHaveLength(4);
    });
  });

  test('lists no kit details on a coach profile', async () => {
    mockUsePermissions.mockReturnValue(
      createPermissionsMock({ isCoach: true }),
    );
    renderWithUI(
      <TeamInfo
        user={{ ...MOCK_USER_WITH_COACH, role: UserRole.COACH }}
        viewOnly={false}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('Join Date')).toBeInTheDocument();
    });
    expect(
      screen.queryByRole('heading', { name: 'Jersey' }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText('Shirt Size')).not.toBeInTheDocument();
  });

  test('disables editing when viewOnly is set', async () => {
    setup({ viewOnly: true });

    await waitFor(() => {
      expect(screen.getByRole('button')).toBeDisabled();
    });
  });

  test('reveals the editable fields when editing', async () => {
    const { user } = setup();

    const joinDate = await enterEditMode(user);

    expect(joinDate).toBeInTheDocument();
    // Non-admins cannot change the role: no role picker, just their own fields.
    expect(screen.queryByText('Role')).not.toBeInTheDocument();
    // The jersey fields keep the same labelled rule as read mode.
    expect(screen.getByRole('heading', { name: 'Jersey' })).toBeInTheDocument();
    expect(screen.getByRole('spinbutton')).toBeInTheDocument();
  });

  test('shows a player profile’s kit to an admin viewer', async () => {
    // The viewer's role must not decide what the profile displays.
    setup({ isAdmin: true, isPlayer: false });

    await waitFor(() => {
      expect(screen.getByText(MOCK_PLAYER.jersey_name!)).toBeInTheDocument();
    });
  });

  test('submits the edited values through updateTeamInfo', async () => {
    mockUpdateTeamInfo.mockResolvedValue({ success: true, message: 'Updated' });

    const { container, user } = setup();

    const joinDate = await enterEditMode(user);
    await user.clear(joinDate);
    await user.type(joinDate, '01/03/2024');
    // The picker commits the typed value on blur.
    await user.tab();

    const submit = container.querySelector(
      'button[type="submit"]',
    ) as HTMLButtonElement;
    await waitFor(() => expect(submit).toBeEnabled());
    await user.click(submit);

    await waitFor(() => {
      expect(mockUpdateTeamInfo).toHaveBeenCalledWith(
        MOCK_USER_WITH_PLAYER.id,
        expect.objectContaining({
          user: expect.objectContaining({ join_date: '2024-03-01' }),
        }),
      );
    });
  });

  test('refreshes the active players cache after activating a member', async () => {
    mockUpdateTeamInfo.mockResolvedValue({ success: true, message: 'Updated' });

    const { container, user } = setup();

    const joinDate = await enterEditMode(user);
    await user.clear(joinDate);
    await user.type(joinDate, '01/03/2024');
    // The picker commits the typed value on blur.
    await user.tab();

    const submit = container.querySelector(
      'button[type="submit"]',
    ) as HTMLButtonElement;
    await waitFor(() => expect(submit).toBeEnabled());
    await user.click(submit);

    // MOCK_USER_WITH_PLAYER is ACTIVE, so the players cache should be revalidated.
    await waitFor(() => expect(mockMutate).toHaveBeenCalled());
    expect(MOCK_USER_WITH_PLAYER.state).toBe(UserState.ACTIVE);
  });

  test('cancels editing and resets the form when the close button is clicked', async () => {
    const { user } = setup();

    await enterEditMode(user);

    await user.click(screen.getByRole('button', { name: /close/i }));

    await waitFor(() => {
      // Back to read-only mode: the edit icon button is the only button.
      expect(screen.getAllByRole('button')).toHaveLength(1);
    });
  });

  test('shows an error toast when updateTeamInfo fails', async () => {
    mockUpdateTeamInfo.mockResolvedValue({ success: false, message: 'Error!' });

    const { container, user } = setup();

    const joinDate = await enterEditMode(user);
    await user.clear(joinDate);
    await user.type(joinDate, '01/03/2024');
    await user.tab();

    const submit = container.querySelector(
      'button[type="submit"]',
    ) as HTMLButtonElement;
    await waitFor(() => expect(submit).toBeEnabled());
    await user.click(submit);

    await waitFor(() => expect(mockUpdateTeamInfo).toHaveBeenCalled());
    // mutate should NOT be called on failure.
    expect(mockMutate).not.toHaveBeenCalled();
  });

  test('does not call mutate when the updated state is not active', async () => {
    const inactiveUser = {
      ...MOCK_USER_WITH_PLAYER,
      state: UserState.INACTIVE,
    };
    mockUsePermissions.mockReturnValue(
      createPermissionsMock({ isPlayer: true }),
    );
    mockUpdateTeamInfo.mockResolvedValue({ success: true, message: 'Updated' });

    const { container, user } = renderWithUI(
      <TeamInfo user={inactiveUser} viewOnly={false} />,
    );

    await user.click(screen.getByRole('button'));
    const joinDate = await screen.findByDisplayValue(
      formatDate(inactiveUser.join_date),
    );
    await user.clear(joinDate);
    await user.type(joinDate, '01/03/2024');
    await user.tab();

    const submit = container.querySelector(
      'button[type="submit"]',
    ) as HTMLButtonElement;
    await waitFor(() => expect(submit).toBeEnabled());
    await user.click(submit);

    await waitFor(() => expect(mockUpdateTeamInfo).toHaveBeenCalled());
    expect(mockMutate).not.toHaveBeenCalled();
  });

  test('marks a missing join date as not provided', async () => {
    const userNoJoinDate = { ...MOCK_USER_WITH_PLAYER, join_date: null };
    mockUsePermissions.mockReturnValue(
      createPermissionsMock({ isPlayer: true }),
    );

    renderWithUI(<TeamInfo user={userNoJoinDate} viewOnly={false} />);

    await waitFor(() => {
      expect(screen.getByText('Join Date')).toBeInTheDocument();
      expect(screen.getByText('Not provided')).toBeInTheDocument();
    });
  });

  test('shows the role/position selector in edit mode for an admin', async () => {
    const { user } = setup({ isAdmin: true });

    await user.click(screen.getByRole('button'));

    // Admin can see the role selector; the join date field also appears.
    await waitFor(() => {
      expect(screen.getByText('Role')).toBeInTheDocument();
    });
  });

  test('changes the jersey number via the number input', async () => {
    mockUpdateTeamInfo.mockResolvedValue({ success: true, message: 'Updated' });

    const { container, user } = setup();

    await enterEditMode(user);

    // The jersey number input is a spinbutton.
    const jerseyInput = screen.getByRole('spinbutton');
    await user.clear(jerseyInput);
    await user.type(jerseyInput, '7');
    // Also update join date to mark form dirty so submit enables.
    const joinDate = screen.getByDisplayValue(
      formatDate(MOCK_USER_WITH_PLAYER.join_date),
    );
    await user.clear(joinDate);
    await user.type(joinDate, '01/03/2024');
    await user.tab();

    const submit = container.querySelector(
      'button[type="submit"]',
    ) as HTMLButtonElement;
    await waitFor(() => expect(submit).toBeEnabled());
    await user.click(submit);

    await waitFor(() =>
      expect(mockUpdateTeamInfo).toHaveBeenCalledWith(
        MOCK_USER_WITH_PLAYER.id,
        expect.objectContaining({
          player: expect.objectContaining({ jersey_number: expect.anything() }),
        }),
      ),
    );
  });

  test('lists no kit on a super admin profile', async () => {
    const superAdminUser = {
      ...MOCK_USER_WITH_PLAYER,
      role: UserRole.SUPER_ADMIN,
    };
    mockUsePermissions.mockReturnValue(
      createPermissionsMock({ isPlayer: true }),
    );

    renderWithUI(<TeamInfo user={superAdminUser} viewOnly={false} />);

    // Admins have no kit.
    await waitFor(() => {
      expect(
        screen.getByText(formatDate(MOCK_USER_WITH_PLAYER.join_date)),
      ).toBeInTheDocument();
    });
    expect(
      screen.queryByRole('heading', { name: 'Jersey' }),
    ).not.toBeInTheDocument();
  });

  test('shows coach positionName in admin edit mode for a coach user', async () => {
    const coachUser = { ...MOCK_USER_WITH_COACH, role: UserRole.COACH };
    mockUsePermissions.mockReturnValue(
      createPermissionsMock({ isAdmin: true, isCoach: true }),
    );

    const { user } = renderWithUI(
      <TeamInfo user={coachUser} viewOnly={false} />,
    );

    // Enter edit mode so the RolePositionSelection appears.
    await user.click(screen.getByRole('button'));

    // The form renders in admin edit mode with the coach's role pre-selected.
    await waitFor(() => {
      expect(screen.getByText('Role')).toBeInTheDocument();
    });
    // Jersey fields follow the picked role, not the admin viewer's.
    expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();
  });

  test('follows the language toggle', async () => {
    mockUsePermissions.mockReturnValue(
      createPermissionsMock({ isPlayer: true }),
    );

    renderWithUI(<TeamInfo user={MOCK_USER_WITH_PLAYER} viewOnly={false} />, {
      locale: 'vi',
    });

    await waitFor(() => {
      expect(screen.getByText('Ngày gia nhập')).toBeInTheDocument();
    });
    expect(
      screen.getByText(formatDate(MOCK_USER_WITH_PLAYER.join_date)),
    ).toBeInTheDocument();
  });
});
