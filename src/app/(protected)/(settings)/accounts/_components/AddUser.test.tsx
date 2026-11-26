import { NO_EMAIL_DOMAIN } from '@/utils/constants';
import { AccountStatus } from '@/utils/enum';

import { createAccount } from '@/actions/account';
import type { Account } from '@/db/account';
import { MOCK_ACCOUNT, MOCK_INVITED_ACCOUNT } from '@/test/mocks/account';
import { MOCK_USER } from '@/test/mocks/user';
import {
  createToasterMock,
  expectNoA11yViolations,
  renderWithUI,
  screen,
  setupTestLifecycle,
  waitFor,
} from '@/test/utilities';

import AddUser from './AddUser';
import { UpdateAccount } from './UpdateAccount';

vi.mock('@/actions/account', () => ({
  createAccount: vi.fn(),
}));

vi.mock('./UpdateAccount', () => ({
  UpdateAccount: { open: vi.fn() },
}));

vi.mock('@/components/ui/toaster', () => createToasterMock());

// The role/state selectors have their own tests; render markers here so the
// dialog body mounts without their internal wiring.
vi.mock('@/components/user/RolePositionSelection', () => ({
  RolePositionSelection: () => <div>RolePositionSelection</div>,
}));
vi.mock('@/components/user/StateSelection', () => ({
  ControlledStateSelection: () => <div>ControlledStateSelection</div>,
}));

describe('AddUser', () => {
  const mockAddUser = vi.mocked(createAccount);
  const NAME = 'Hoang Nguyen';
  const EMAIL = MOCK_USER.email;

  const setup = (members: Array<Account> = [MOCK_ACCOUNT]) =>
    renderWithUI(<AddUser members={members} />);

  const openDialog = async (members?: Array<Account>) => {
    const view = setup(members);
    await view.user.click(screen.getByRole('button', { name: /Add/ }));
    return view;
  };

  setupTestLifecycle();

  test('should be accessible', async () => {
    await openDialog();

    await expectNoA11yViolations();
  });

  test('renders the trigger button', () => {
    setup();

    expect(screen.getByRole('button', { name: /Add/ })).toBeInTheDocument();
  });

  test('opens the dialog with its fields when triggered', async () => {
    await openDialog();

    expect(await screen.findByText('Add Member')).toBeInTheDocument();
    expect(screen.getByText('Fullname')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('DOB')).toBeInTheDocument();
    expect(screen.getByText('RolePositionSelection')).toBeInTheDocument();
    expect(screen.getByText('ControlledStateSelection')).toBeInTheDocument();
  });

  test('keeps the submit button disabled while the form is invalid', async () => {
    await openDialog();

    const submit = await screen.findByRole('button', { name: /^Add$/ });

    expect(submit).toBeDisabled();
    expect(mockAddUser).not.toHaveBeenCalled();
  });

  test('does not submit an empty form', async () => {
    const { user } = await openDialog();

    const submit = await screen.findByRole('button', { name: /^Add$/ });
    await user.click(submit);

    await waitFor(() => {
      expect(mockAddUser).not.toHaveBeenCalled();
    });
  });

  test('submits the form once the required fields are valid', async () => {
    mockAddUser.mockResolvedValue({ success: true, message: 'Added' });

    const { user } = await openDialog();

    await user.type(screen.getByLabelText(/fullname/i), NAME);
    await user.type(screen.getByLabelText(/email/i), EMAIL);

    const submit = await screen.findByRole('button', { name: /^Add$/ });
    await waitFor(() => expect(submit).toBeEnabled());
    await user.click(submit);

    await waitFor(() => {
      expect(mockAddUser).toHaveBeenCalledWith(
        expect.objectContaining({
          name: NAME,
          email: EMAIL,
        }),
      );
    });
  });

  test('shows an error toast and keeps the form when submission fails', async () => {
    mockAddUser.mockResolvedValue({ success: false, message: 'Email taken' });

    const { user } = await openDialog();

    await user.type(screen.getByLabelText(/fullname/i), NAME);
    await user.type(screen.getByLabelText(/email/i), EMAIL);

    const submit = await screen.findByRole('button', { name: /^Add$/ });
    await waitFor(() => expect(submit).toBeEnabled());
    await user.click(submit);

    await waitFor(() => expect(mockAddUser).toHaveBeenCalled());
    // The dialog stays open with the entered values on failure.
    expect(screen.getByLabelText(/fullname/i)).toHaveValue(NAME);
  });

  test('clears the form after a successful add', async () => {
    mockAddUser.mockResolvedValue({ success: true, message: 'Added' });

    const { user } = await openDialog();

    await user.type(screen.getByLabelText(/fullname/i), NAME);
    const submit = await screen.findByRole('button', { name: /^Add$/ });
    await waitFor(() => expect(submit).toBeEnabled());
    await user.click(submit);

    await waitFor(() => {
      expect(screen.getByLabelText(/fullname/i)).toHaveValue('');
    });
  });

  describe('duplicate names', () => {
    test('warns nothing for a blank or new name', async () => {
      const { user } = await openDialog();

      expect(screen.queryByText(/already listed/)).not.toBeInTheDocument();
      await user.type(screen.getByLabelText(/fullname/i), NAME);
      expect(screen.queryByText(/already listed/)).not.toBeInTheDocument();
    });

    test('lists the member already using the name', async () => {
      const { user } = await openDialog();

      await user.type(screen.getByLabelText(/fullname/i), MOCK_ACCOUNT.name);

      expect(
        await screen.findByText('Someone with this name is already listed'),
      ).toBeInTheDocument();
      expect(screen.getByText(MOCK_ACCOUNT.email)).toBeInTheDocument();
      expect(screen.getByText('Activated')).toBeInTheDocument();
    });

    test('counts several matches and shows "No email" for placeholders', async () => {
      const { user } = await openDialog([
        MOCK_ACCOUNT,
        {
          ...MOCK_INVITED_ACCOUNT,
          name: MOCK_ACCOUNT.name,
          email: `x@${NO_EMAIL_DOMAIN}`,
          status: AccountStatus.NO_EMAIL,
        },
      ]);

      await user.type(screen.getByLabelText(/fullname/i), MOCK_ACCOUNT.name);

      expect(
        await screen.findByText('2 people with this name are already listed'),
      ).toBeInTheDocument();
      expect(screen.getAllByText('No email').length).toBeGreaterThan(0);
    });

    test('opens the existing account instead', async () => {
      const { user } = await openDialog();

      await user.type(screen.getByLabelText(/fullname/i), MOCK_ACCOUNT.name);
      await user.click(await screen.findByRole('button', { name: 'Open' }));

      expect(UpdateAccount.open).toHaveBeenCalledWith('update-account', {
        account: MOCK_ACCOUNT,
      });
      await waitFor(() => {
        expect(screen.queryByText('Add Member')).not.toBeInTheDocument();
      });
    });
  });
});
