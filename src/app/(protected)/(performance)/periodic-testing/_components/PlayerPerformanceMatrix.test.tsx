import * as nuqs from 'nuqs';
import { Mock } from 'vitest';

import {
  MOCK_TEST_PLAYER_2,
  MOCK_TEST_RESULT,
  MOCK_TEST_RESULT_DATE,
  MOCK_TEST_RESULT_INPUT,
  MOCK_TEST_RESULT_RESPONSE,
  MOCK_TEST_TYPE,
  MOCK_TEST_TYPE_2,
} from '@/test/mocks/periodic-testing';
import { MOCK_PLAYER, MOCK_USER } from '@/test/mocks/user';
import { renderWithUI, screen, waitFor } from '@/test/utilities';

import usePermissions from '@/hooks/use-permissions';

import {
  createTestResult,
  deleteTestResultById,
  updateTestResultById,
} from '@/actions/test-result';
import { TestResult } from '@/types/periodic-testing';

import PlayerPerformanceMatrix from './PlayerPerformanceMatrix';

vi.mock('@/hooks/use-permissions', () => ({
  default: vi.fn(),
}));

vi.mock('@/actions/test-result', () => ({
  createTestResult: vi.fn(),
  updateTestResultById: vi.fn(),
  deleteTestResultById: vi.fn(),
}));

vi.mock('@/components/ui/toaster', () => ({
  toaster: {
    create: vi.fn(() => 'toast-id'),
    update: vi.fn(),
  },
}));

// The first player's second-type cell is empty (see the mock), so it exercises
// the "create result" path; the value shown for the first player.
const FIRST_RESULT = MOCK_TEST_RESULT_INPUT.result;

describe('PlayerPerformanceMatrix', () => {
  const mockUsePermissions = usePermissions as unknown as Mock;
  const mockCreate = createTestResult as unknown as Mock;
  const mockUpdate = updateTestResultById as unknown as Mock;
  const mockDelete = deleteTestResultById as unknown as Mock;

  const setup = ({
    result = MOCK_TEST_RESULT_RESPONSE,
    canEdit = true,
    params = {},
  }: {
    result?: TestResult;
    canEdit?: boolean;
    params?: Record<string, unknown>;
  } = {}) => {
    mockUsePermissions.mockReturnValue({
      can: () => canEdit,
    });
    (nuqs.useQueryStates as unknown as Mock).mockReturnValue([
      { page: 1, q: '', date: MOCK_TEST_RESULT_DATE, type: [], ...params },
      vi.fn(),
    ]);

    return renderWithUI(<PlayerPerformanceMatrix result={result} />);
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders a column header with its unit for each test type', () => {
    setup();

    expect(screen.getByText(MOCK_TEST_TYPE.name)).toBeInTheDocument();
    expect(screen.getByText(`(${MOCK_TEST_TYPE.unit})`)).toBeInTheDocument();
    expect(screen.getByText(MOCK_TEST_TYPE_2.name)).toBeInTheDocument();
    expect(screen.getByText(`(${MOCK_TEST_TYPE_2.unit})`)).toBeInTheDocument();
  });

  test('renders a row for each player with their scores', () => {
    setup();

    expect(screen.getByText(MOCK_USER.name)).toBeInTheDocument();
    expect(screen.getByText(MOCK_TEST_PLAYER_2.name)).toBeInTheDocument();
    expect(screen.getByText(FIRST_RESULT)).toBeInTheDocument();
  });

  test('shows the empty state when there are no players', () => {
    setup({ result: { ...MOCK_TEST_RESULT_RESPONSE, players: [] } });

    expect(screen.getByText('No test result found')).toBeInTheDocument();
  });

  test('filters the players by the search query', () => {
    setup({ params: { q: MOCK_USER.name.toLowerCase() } });

    expect(screen.getByText(MOCK_USER.name)).toBeInTheDocument();
    expect(screen.queryByText(MOCK_TEST_PLAYER_2.name)).not.toBeInTheDocument();
  });

  test('restricts the columns to the selected test types', () => {
    setup({ params: { type: [MOCK_TEST_TYPE.name] } });

    expect(screen.getByText(MOCK_TEST_TYPE.name)).toBeInTheDocument();
    expect(screen.queryByText(MOCK_TEST_TYPE_2.name)).not.toBeInTheDocument();
  });

  test('updates an existing result when a filled cell is committed', async () => {
    mockUpdate.mockResolvedValue({ success: true, message: 'Updated' });

    const { user } = setup();

    await user.click(screen.getByText(FIRST_RESULT));
    const input = await screen.findByRole('spinbutton');
    await user.clear(input);
    await user.type(input, '5{Enter}');

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith({
        result_id: MOCK_TEST_RESULT.result_id,
        result: '5',
      });
    });
    expect(mockCreate).not.toHaveBeenCalled();
  });

  test('creates a result when an empty cell is committed', async () => {
    mockCreate.mockResolvedValue({ success: true, message: 'Created' });

    const { user } = setup();

    // The first player has no second-type score yet (placeholder cell).
    const [emptyCell] = screen.getAllByText('-');
    await user.click(emptyCell);
    const input = await screen.findByRole('spinbutton');
    await user.type(input, '10{Enter}');

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith([
        {
          player_id: MOCK_PLAYER.id,
          type_id: MOCK_TEST_TYPE_2.type_id,
          date: MOCK_TEST_RESULT_DATE,
          result: '10',
        },
      ]);
    });
  });

  test('deletes the result when a filled cell is cleared to empty', async () => {
    mockDelete.mockResolvedValue({ success: true, message: 'Deleted' });

    const { user } = setup();

    await user.click(screen.getByText(FIRST_RESULT));
    const input = await screen.findByRole('spinbutton');
    await user.clear(input);
    await user.type(input, '{Enter}');

    await waitFor(() => {
      expect(mockDelete).toHaveBeenCalledWith(MOCK_TEST_RESULT.result_id);
    });
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  test('reverts and does nothing when an empty cell is left empty', async () => {
    const { user } = setup();

    // The first player has no second-type score yet (placeholder cell).
    const [emptyCell] = screen.getAllByText('-');
    await user.click(emptyCell);
    const input = await screen.findByRole('spinbutton');
    await user.type(input, '{Enter}');

    await waitFor(() => {
      expect(mockCreate).not.toHaveBeenCalled();
    });
    expect(mockDelete).not.toHaveBeenCalled();
  });

  test('does not allow editing without the edit permission', async () => {
    const { user } = setup({ canEdit: false });

    await user.click(screen.getByText(FIRST_RESULT));

    expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();
  });
});
