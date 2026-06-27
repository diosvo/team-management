import { Mock } from 'vitest';

import { renderWithUI, screen, waitFor } from '@/test/utilities';

import { addUser } from '@/actions/user';

import AddUser from './AddUser';

vi.mock('@/actions/user', () => ({
  addUser: vi.fn(),
}));

vi.mock('@/components/ui/toaster', () => ({
  toaster: {
    create: vi.fn(() => 'toast-id'),
    update: vi.fn(),
  },
}));

// The role/state selectors have their own tests; render markers here so the
// dialog body mounts without their internal wiring.
vi.mock('@/components/user/RolePositionSelection', () => ({
  RolePositionSelection: () => <div>RolePositionSelection</div>,
}));
vi.mock('@/components/user/StateSelection', () => ({
  ControlledStateSelection: () => <div>ControlledStateSelection</div>,
}));

describe('AddUser', () => {
  const mockAddUser = addUser as unknown as Mock;

  const setup = () => renderWithUI(<AddUser />);

  const openDialog = async () => {
    const view = setup();
    await view.user.click(screen.getByRole('button', { name: /Add/ }));
    return view;
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders the trigger button', () => {
    setup();

    expect(screen.getByRole('button', { name: /Add/ })).toBeInTheDocument();
  });

  test('opens the dialog with its fields when triggered', async () => {
    await openDialog();

    expect(await screen.findByText('Add to Roster')).toBeInTheDocument();
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
});
