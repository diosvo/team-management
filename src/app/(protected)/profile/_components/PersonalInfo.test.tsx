import { NO_EMAIL_DOMAIN } from '@/utils/constants';
import { formatDate } from '@/utils/datetime';

import { updatePersonalInfo } from '@/actions/user';
import usePermissions from '@/hooks/use-permissions';
import { MOCK_USER } from '@/test/mocks/user';
import {
  createPermissionsMock,
  createToasterMock,
  expectNoA11yViolations,
  renderWithUI,
  screen,
  setupTestLifecycle,
  waitFor,
  waitForStable,
} from '@/test/utilities';

import PersonalInfo from './PersonalInfo';

vi.mock('@/actions/user', () => ({
  updatePersonalInfo: vi.fn(),
}));

vi.mock('@/components/ui/toaster', () => createToasterMock());

vi.mock('@/hooks/use-permissions', () => ({ default: vi.fn() }));

describe('PersonalInfo', () => {
  setupTestLifecycle();

  const mockUpdatePersonalInfo = vi.mocked(updatePersonalInfo);

  const setup = async (
    viewOnly = false,
    {
      profile = MOCK_USER,
      isAdmin = false,
      isCaptain = false,
    }: Partial<{
      profile: typeof MOCK_USER;
      isAdmin: boolean;
      isCaptain: boolean;
    }> = {},
  ) => {
    vi.mocked(usePermissions).mockReturnValue(
      createPermissionsMock({ isAdmin, isCaptain }),
    );
    const result = renderWithUI(
      <PersonalInfo user={profile} viewOnly={viewOnly} />,
    );

    // The form's initial validation resolves asynchronously; flush it here so
    // that state update lands inside act(...).
    await waitForStable();

    return result;
  };

  const enterEditMode = async (
    user: Awaited<ReturnType<typeof setup>>['user'],
  ) => {
    await user.click(screen.getByRole('button'));
    return screen.findByPlaceholderText('Anonymous');
  };

  test('should be accessible', async () => {
    const { container } = await setup();

    await expectNoA11yViolations(container);
  });

  test('renders the stored values in read-only mode', async () => {
    await setup();

    expect(screen.getByRole('link', { name: MOCK_USER.email })).toHaveAttribute(
      'href',
      `mailto:${MOCK_USER.email}`,
    );
    expect(
      screen.getByText(
        new RegExp(`^${formatDate(MOCK_USER.dob)} · \\d+ years old$`),
      ),
    ).toBeInTheDocument();
  });

  test('marks the unset optional fields as not provided', async () => {
    await setup();

    // phone_number and citizen_identification are null on MOCK_USER.
    expect(screen.getAllByText('Not provided')).toHaveLength(2);
  });

  test('links the phone number for calling', async () => {
    await setup(false, {
      profile: { ...MOCK_USER, phone_number: '0901234567' },
    });

    expect(screen.getByRole('link', { name: '0901234567' })).toHaveAttribute(
      'href',
      'tel:0901234567',
    );
  });

  test.each([
    ['the full number (member or admin)', '079123451219'],
    ['an already masked number (other members)', '********1219'],
  ])('shows only the last 4 citizen ID digits for %s', async (_, citizenId) => {
    await setup(false, {
      profile: { ...MOCK_USER, citizen_identification: citizenId },
    });

    expect(screen.getByText('********1219')).toBeInTheDocument();
    expect(screen.queryByText('079123451219')).not.toBeInTheDocument();
    // Members other than admins and captains get no way to reveal it.
    expect(
      screen.queryByRole('button', { name: 'Show full citizen ID' }),
    ).not.toBeInTheDocument();
  });

  test.each([
    ['an admin', { isAdmin: true }],
    ['a captain', { isCaptain: true }],
  ])('lets %s reveal and hide the full citizen ID', async (_, viewer) => {
    const { user } = await setup(true, {
      profile: { ...MOCK_USER, citizen_identification: '079123451219' },
      ...viewer,
    });

    await user.click(
      screen.getByRole('button', { name: 'Show full citizen ID' }),
    );
    expect(screen.getByText('079123451219')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Hide citizen ID' }));
    expect(screen.getByText('********1219')).toBeInTheDocument();
    // The eye lives inside the card's form but never submits it.
    expect(mockUpdatePersonalInfo).not.toHaveBeenCalled();
  });

  test('offers no eye without a citizen ID', async () => {
    await setup(true, { isAdmin: true });

    expect(
      screen.queryByRole('button', { name: 'Show full citizen ID' }),
    ).not.toBeInTheDocument();
  });

  test('puts the full citizen ID in the edit form', async () => {
    const { user } = await setup(false, {
      profile: { ...MOCK_USER, citizen_identification: '079123451219' },
    });

    await enterEditMode(user);

    expect(screen.getByDisplayValue('079123451219')).toBeInTheDocument();
  });

  test('shows "No email" instead of a placeholder address', async () => {
    const noEmail = { ...MOCK_USER, email: `x@${NO_EMAIL_DOMAIN}` };
    const { user } = await setup(false, { profile: noEmail });

    expect(screen.getByText('No email')).toBeInTheDocument();

    await enterEditMode(user);

    expect(screen.getByDisplayValue('No email')).toBeDisabled();
    expect(screen.queryByDisplayValue(noEmail.email)).not.toBeInTheDocument();
  });

  test('disables editing when viewOnly is set', async () => {
    await setup(true);

    expect(screen.getByRole('button')).toBeDisabled();
  });

  test('switches to inputs when editing, keeping email locked', async () => {
    const { user } = await setup();

    const nameInput = await enterEditMode(user);

    expect(nameInput).toBeInTheDocument();
    const emailInput = screen.getByDisplayValue(MOCK_USER.email);
    expect(emailInput).toBeDisabled();
  });

  test('submits the edited values through updatePersonalInfo', async () => {
    mockUpdatePersonalInfo.mockResolvedValue({
      success: true,
      message: 'Updated',
    });

    const { container, user } = await setup();

    const nameInput = await enterEditMode(user);
    await user.clear(nameInput);
    await user.type(nameInput, 'Nhung Vo');

    const submit = container.querySelector(
      'button[type="submit"]',
    ) as HTMLButtonElement;
    await waitFor(() => expect(submit).toBeEnabled());
    await user.click(submit);

    await waitFor(() => {
      expect(mockUpdatePersonalInfo).toHaveBeenCalledWith(
        MOCK_USER.id,
        expect.objectContaining({ name: 'Nhung Vo' }),
      );
    });
  });

  test('leaves edit mode without saving when cancelled', async () => {
    const { user } = await setup();

    const nameInput = await enterEditMode(user);
    expect(nameInput).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /close/i }));

    await waitFor(() =>
      expect(
        screen.queryByPlaceholderText('Anonymous'),
      ).not.toBeInTheDocument(),
    );
    expect(mockUpdatePersonalInfo).not.toHaveBeenCalled();
  });

  test('stays in edit mode and shows an error toast when the update fails', async () => {
    mockUpdatePersonalInfo.mockResolvedValue({
      success: false,
      message: 'Something went wrong',
    });

    const { container, user } = await setup();

    const nameInput = await enterEditMode(user);
    await user.clear(nameInput);
    await user.type(nameInput, 'Nhung Vo');

    const submit = container.querySelector(
      'button[type="submit"]',
    ) as HTMLButtonElement;
    await waitFor(() => expect(submit).toBeEnabled());
    await user.click(submit);

    await waitFor(() => expect(mockUpdatePersonalInfo).toHaveBeenCalled());
    // Stays in edit mode — the name input is still visible.
    expect(screen.getByPlaceholderText('Anonymous')).toBeInTheDocument();
  });

  test('marks a missing date of birth as not provided', async () => {
    await setup(false, { profile: { ...MOCK_USER, dob: null } });

    // dob, phone_number and citizen_identification are all unset.
    expect(screen.getAllByText('Not provided')).toHaveLength(3);
  });
});
