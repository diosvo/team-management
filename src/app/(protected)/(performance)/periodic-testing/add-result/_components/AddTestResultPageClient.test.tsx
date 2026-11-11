import { createTestResult } from '@/actions/test-result';
import {
  MOCK_TEST_RESULT_DATE,
  MOCK_TEST_TYPE,
} from '@/test/mocks/periodic-testing';
import { MOCK_PLAYER } from '@/test/mocks/user';
import {
  createToasterMock,
  renderWithUI,
  screen,
  setupTestLifecycle,
  waitFor,
} from '@/test/utilities';

import AddTestResultPageClient from './AddTestResultPageClient';

const mockReplace = vi.fn();

vi.mock('next/navigation', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next/navigation')>();
  return {
    ...actual,
    useRouter: () => ({ replace: mockReplace }),
  };
});

vi.mock('@/actions/test-result', () => ({
  createTestResult: vi.fn(),
}));

vi.mock('@/components/ui/toaster', () => createToasterMock());

// Drive the internal selection state from the configuration step marker.
vi.mock('./TestResultConfiguration', () => ({
  default: ({ setSelection }: { setSelection: (next: unknown) => void }) => (
    <button
      onClick={() =>
        setSelection({
          players: [{ id: MOCK_PLAYER.id }],
          types: [{ type_id: MOCK_TEST_TYPE.type_id }],
          date: MOCK_TEST_RESULT_DATE,
        })
      }
    >
      configure
    </button>
  ),
}));

vi.mock('./TestResultTable', () => ({
  default: () => <div>TestResultTable</div>,
}));

describe('AddTestResultPageClient', () => {
  const mockCreate = vi.mocked(createTestResult);

  const setup = () => renderWithUI(<AddTestResultPageClient />);

  setupTestLifecycle();

  test('renders both step cards', () => {
    setup();

    expect(screen.getByText('Test Configuration')).toBeInTheDocument();
    expect(screen.getByText('Test Result')).toBeInTheDocument();
  });

  test('disables the save button until a selection is made', () => {
    setup();

    expect(screen.getByRole('button', { name: /save/i })).toBeDisabled();
  });

  test('saves the derived results and redirects on success', async () => {
    mockCreate.mockResolvedValue({ success: true, message: 'Saved' });

    const { user } = setup();

    await user.click(screen.getByText('configure'));

    const save = screen.getByRole('button', { name: /save/i });
    await waitFor(() => expect(save).toBeEnabled());
    await user.click(save);

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith([
        {
          type_id: MOCK_TEST_TYPE.type_id,
          player_id: MOCK_PLAYER.id,
          result: '0',
          date: MOCK_TEST_RESULT_DATE,
        },
      ]);
    });

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith(
        `/periodic-testing?date=${MOCK_TEST_RESULT_DATE}`,
      );
    });
  });

  test('does not redirect when saving fails', async () => {
    mockCreate.mockResolvedValue({ success: false, message: 'Boom' });

    const { user } = setup();

    await user.click(screen.getByText('configure'));

    const save = screen.getByRole('button', { name: /save/i });
    await waitFor(() => expect(save).toBeEnabled());
    await user.click(save);

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalled();
    });
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
