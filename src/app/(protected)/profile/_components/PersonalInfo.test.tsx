import { MOCK_USER } from '@/test/mocks/user';
import {
  createToasterMock,
  expectNoA11yViolations,
  renderWithUI,
  screen,
  setupTestLifecycle,
  waitFor,
  waitForStable,
} from '@/test/utilities';

import { updatePersonalInfo } from '@/actions/user';
import { formatDate } from '@/utils/formatter';

import PersonalInfo from './PersonalInfo';

vi.mock('@/actions/user', () => ({
  updatePersonalInfo: vi.fn(),
}));

vi.mock('@/components/ui/toaster', () => createToasterMock());

describe('PersonalInfo', () => {
  setupTestLifecycle();

  const mockUpdatePersonalInfo = vi.mocked(updatePersonalInfo);

  const setup = async (viewOnly = false) => {
    const result = renderWithUI(
      <PersonalInfo user={MOCK_USER} viewOnly={viewOnly} />,
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

    expect(screen.getByText(MOCK_USER.email)).toBeInTheDocument();
    expect(screen.getByText(MOCK_USER.name)).toBeInTheDocument();
    expect(screen.getByText(formatDate(MOCK_USER.dob))).toBeInTheDocument();
  });

  test('renders a dash for the unset optional fields', async () => {
    await setup();

    // phone_number and citizen_identification are null on MOCK_USER.
    expect(screen.getAllByText('-')).toHaveLength(2);
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
});
