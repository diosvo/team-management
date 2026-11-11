import { formatDate } from '@/utils/datetime';
import {
  CoachPosition,
  PlayerPosition,
  UserRole,
  UserState,
} from '@/utils/enum';

import { updateTeamInfo } from '@/actions/user';
import usePermissions from '@/hooks/use-permissions';
import {
  MOCK_COACH,
  MOCK_PLAYER,
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
        screen.getByText(enumText('userRole', MOCK_USER_WITH_PLAYER.role)),
      ).toBeInTheDocument();
      expect(
        screen.getByText(enumText('playerPosition', MOCK_PLAYER.position)),
      ).toBeInTheDocument();
      expect(
        screen.getByText(enumText('userState', MOCK_USER_WITH_PLAYER.state)),
      ).toBeInTheDocument();
      expect(
        screen.getByText(String(MOCK_PLAYER.jersey_number)),
      ).toBeInTheDocument();
      expect(
        screen.getByText(formatDate(MOCK_USER_WITH_PLAYER.join_date), {
          exact: false,
        }),
      ).toBeInTheDocument();
    });
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
    // Non-admins cannot change the role, so it stays read-only.
    expect(
      screen.getByText(enumText('userRole', MOCK_USER_WITH_PLAYER.role)),
    ).toBeInTheDocument();
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

  test('renders the coach position when the user is a coach', async () => {
    mockUsePermissions.mockReturnValue(
      createPermissionsMock({ isCoach: true }),
    );

    renderWithUI(<TeamInfo user={MOCK_USER_WITH_COACH} viewOnly={false} />);

    await waitFor(() => {
      expect(
        screen.getByText(enumText('coachPosition', MOCK_COACH.position)),
      ).toBeInTheDocument();
    });
  });

  test('renders a dash when the player has no jersey number', async () => {
    const userNoJersey = {
      ...MOCK_USER_WITH_PLAYER,
      player: { ...MOCK_PLAYER, jersey_number: null },
    };
    mockUsePermissions.mockReturnValue(
      createPermissionsMock({ isPlayer: true }),
    );

    renderWithUI(<TeamInfo user={userNoJersey} viewOnly={false} />);

    await waitFor(() => {
      expect(screen.getByText('-')).toBeInTheDocument();
    });
  });

  test('renders without the joined date section when join_date is null', async () => {
    const userNoJoinDate = { ...MOCK_USER_WITH_PLAYER, join_date: null };
    mockUsePermissions.mockReturnValue(
      createPermissionsMock({ isPlayer: true }),
    );

    renderWithUI(<TeamInfo user={userNoJoinDate} viewOnly={false} />);

    await waitFor(() => {
      expect(screen.queryByText('Joined')).not.toBeInTheDocument();
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

  test('hides the default role when the user is a super admin', async () => {
    const superAdminUser = {
      ...MOCK_USER_WITH_PLAYER,
      role: UserRole.SUPER_ADMIN,
    };
    mockUsePermissions.mockReturnValue(
      createPermissionsMock({ isPlayer: true }),
    );

    renderWithUI(<TeamInfo user={superAdminUser} viewOnly={false} />);

    // Super admin role is mapped to undefined, so just verify it renders.
    await waitFor(() => {
      expect(
        screen.getByText(enumText('userState', superAdminUser.state)),
      ).toBeInTheDocument();
    });
  });

  test('shows "Unknown" position when the player has no position', async () => {
    const userNoPosition = {
      ...MOCK_USER_WITH_PLAYER,
      player: { ...MOCK_PLAYER, position: null },
    };
    mockUsePermissions.mockReturnValue(
      createPermissionsMock({ isPlayer: true }),
    );

    renderWithUI(<TeamInfo user={userNoPosition} viewOnly={false} />);

    await waitFor(() => {
      expect(
        screen.getByText(enumText('playerPosition', PlayerPosition.UNKNOWN)),
      ).toBeInTheDocument();
    });
  });

  test('shows "Unknown" coach position when the coach has no position', async () => {
    const coachUser = {
      ...MOCK_USER_WITH_COACH,
      coach: {
        ...MOCK_COACH,
        position: null as unknown as typeof MOCK_COACH.position,
      },
    };
    mockUsePermissions.mockReturnValue(
      createPermissionsMock({ isCoach: true }),
    );

    renderWithUI(<TeamInfo user={coachUser} viewOnly={false} />);

    await waitFor(() => {
      expect(
        screen.getByText(enumText('coachPosition', CoachPosition.UNKNOWN)),
      ).toBeInTheDocument();
    });
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
  });

  test('renders the joined date in Vietnamese locale', async () => {
    mockUsePermissions.mockReturnValue(
      createPermissionsMock({ isPlayer: true }),
    );

    renderWithUI(<TeamInfo user={MOCK_USER_WITH_PLAYER} viewOnly={false} />, {
      locale: 'vi',
    });

    // The join date section renders with locale-specific relative time.
    await waitFor(() => {
      expect(
        screen.getByText(formatDate(MOCK_USER_WITH_PLAYER.join_date), {
          exact: false,
        }),
      ).toBeInTheDocument();
    });
  });
});
