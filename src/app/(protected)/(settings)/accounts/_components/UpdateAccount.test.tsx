import { NO_EMAIL_DOMAIN } from '@/utils/constants';
import { AccountStatus } from '@/utils/enum';

import { updateAccount } from '@/actions/account';
import type { Account } from '@/db/account';
import { MOCK_ACCOUNT, MOCK_INVITED_ACCOUNT } from '@/test/mocks/account';
import {
  act,
  createToasterMock,
  expectNoA11yViolations,
  mockToaster,
  renderWithUI,
  screen,
  setupTestLifecycle,
  waitFor,
} from '@/test/utilities';

import { UpdateAccount } from './UpdateAccount';

vi.mock('@/actions/account', () => ({
  updateAccount: vi.fn(),
}));

vi.mock('@/components/ui/toaster', () => createToasterMock());

describe('UpdateAccount', () => {
  const mockUpdateAccount = vi.mocked(updateAccount);

  const open = async (account: Account = MOCK_ACCOUNT) => {
    const view = renderWithUI(<UpdateAccount.Viewport />);

    await act(async () => {
      UpdateAccount.open('update-account', { account });
    });

    return view;
  };

  setupTestLifecycle();

  afterEach(() => {
    act(() => {
      UpdateAccount.removeAll();
    });
  });

  test('should be accessible', async () => {
    await open();

    await expectNoA11yViolations();
  });

  test('prefills the name and email', async () => {
    await open();

    expect(await screen.findByText('Update Account')).toBeInTheDocument();
    expect(screen.getByLabelText(/Full name/)).toHaveValue(MOCK_ACCOUNT.name);
    expect(screen.getByLabelText(/Email/)).toHaveValue(MOCK_ACCOUNT.email);
    expect(
      screen.getByText('The member signs in with the new email from now on.'),
    ).toBeInTheDocument();
  });

  test('leaves the email blank and optional for a member without one', async () => {
    await open({
      ...MOCK_INVITED_ACCOUNT,
      email: `x@${NO_EMAIL_DOMAIN}`,
      status: AccountStatus.NO_EMAIL,
    });

    const email = await screen.findByLabelText(/Email/);
    expect(email).toHaveValue('');
    expect(email).not.toBeRequired();
    expect(
      screen.getByText(/Saving an email sends them a link to set a password/),
    ).toBeInTheDocument();
  });

  test('keeps the submit button disabled until something changes', async () => {
    await open();

    expect(
      await screen.findByRole('button', { name: /update/i }),
    ).toBeDisabled();
  });

  test('saves the new email and closes on success', async () => {
    mockUpdateAccount.mockResolvedValue({ success: true, message: 'Saved' });
    const { user } = await open();

    const email = await screen.findByLabelText(/Email/);
    await user.clear(email);
    await user.type(email, 'linh.new@example.com');

    const submit = screen.getByRole('button', { name: /update/i });
    await waitFor(() => expect(submit).toBeEnabled());
    await user.click(submit);

    await waitFor(() => {
      expect(mockUpdateAccount).toHaveBeenCalledWith(MOCK_ACCOUNT.id, {
        name: MOCK_ACCOUNT.name,
        email: 'linh.new@example.com',
      });
    });
    expect(mockToaster.update).toHaveBeenCalledWith('toast-id', {
      type: 'success',
      title: 'Saved',
    });
    await waitFor(() =>
      expect(screen.queryByText('Update Account')).not.toBeInTheDocument(),
    );
  });

  test('stays open with an error toast on failure', async () => {
    mockUpdateAccount.mockResolvedValue({ success: false, message: 'Taken' });
    const { user } = await open();

    await user.type(await screen.findByLabelText(/Full name/), ' Jr');
    const submit = screen.getByRole('button', { name: /update/i });
    await waitFor(() => expect(submit).toBeEnabled());
    await user.click(submit);

    await waitFor(() => {
      expect(mockToaster.update).toHaveBeenCalledWith('toast-id', {
        type: 'error',
        title: 'Taken',
      });
    });
    expect(screen.getByText('Update Account')).toBeInTheDocument();
  });

  test('shows a validation error for an invalid email', async () => {
    const { user } = await open();

    const email = await screen.findByLabelText(/Email/);
    await user.clear(email);
    await user.type(email, 'not-an-email');

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /update/i })).toBeDisabled(),
    );
    expect(mockUpdateAccount).not.toHaveBeenCalled();
  });
});
