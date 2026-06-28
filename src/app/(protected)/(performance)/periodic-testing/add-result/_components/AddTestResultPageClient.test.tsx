import { Mock } from 'vitest';

import { renderWithUI, screen, waitFor } from '@/test/utilities';

import { createTestResult } from '@/actions/test-result';

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

vi.mock('@/components/ui/toaster', () => ({
  toaster: {
    create: vi.fn(() => 'toast-id'),
    update: vi.fn(),
  },
}));

// Drive the internal selection state from the configuration step marker.
vi.mock('./TestResultConfiguration', () => ({
  default: ({
    setSelection,
  }: {
    setSelection: (next: unknown) => void;
  }) => (
    <button
      onClick={() =>
        setSelection({
          players: [{ id: 'p1' }],
          types: [{ type_id: 't1' }],
          date: '2026-01-15',
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
  const mockCreate = createTestResult as unknown as Mock;

  const setup = () => renderWithUI(<AddTestResultPageClient />);

  beforeEach(() => {
    vi.clearAllMocks();
  });

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
          type_id: 't1',
          player_id: 'p1',
          result: '0',
          date: '2026-01-15',
        },
      ]);
    });

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith(
        '/periodic-testing?date=2026-01-15',
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
