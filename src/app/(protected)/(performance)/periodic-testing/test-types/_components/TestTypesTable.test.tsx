import * as nuqs from 'nuqs';
import { Mock } from 'vitest';

import { toaster } from '@/components/ui/toaster';

import {
  MOCK_TEST_TYPE,
  MOCK_TEST_TYPE_2,
} from '@/test/mocks/periodic-testing';
import { renderWithUI, screen, waitFor } from '@/test/utilities';

import usePermissions from '@/hooks/use-permissions';
import { TestTypeUnit } from '@/utils/enum';

import { removeTestType } from '@/actions/test-type';
import { TestType } from '@/drizzle/schema';

import { UpsertTestType } from './UpsertTestType';
import TestTypesTable from './TestTypesTable';

vi.mock('@/hooks/use-permissions', () => ({
  default: vi.fn(),
}));

vi.mock('@/actions/test-type', () => ({
  removeTestType: vi.fn(),
}));

vi.mock('@/components/ui/toaster', () => ({
  toaster: {
    create: vi.fn(),
  },
}));

// Stub the overlay controller; its dialog has its own test.
vi.mock('./UpsertTestType', () => ({
  UpsertTestType: { open: vi.fn(), Viewport: () => null },
}));

describe('TestTypesTable', () => {
  const mockUsePermissions = usePermissions as unknown as Mock;
  const mockRemoveTestType = removeTestType as unknown as Mock;
  const mockOpen = UpsertTestType.open as unknown as Mock;

  const setup = ({
    data = [MOCK_TEST_TYPE, MOCK_TEST_TYPE_2],
    perms = {},
    params = {},
  }: {
    data?: Array<TestType>;
    perms?: Record<string, unknown>;
    params?: Record<string, unknown>;
  } = {}) => {
    mockUsePermissions.mockReturnValue({
      isGuest: false,
      isAdmin: false,
      can: () => false,
      ...perms,
    });
    (nuqs.useQueryStates as unknown as Mock).mockReturnValue([
      { page: 1, q: '', unit: [], ...params },
      vi.fn(),
    ]);

    return renderWithUI(<TestTypesTable data={data} />);
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders a row for each test type', () => {
    setup();

    expect(screen.getByText('Sprint 30m')).toBeInTheDocument();
    expect(screen.getByText('Push-ups')).toBeInTheDocument();
  });

  test('renders the column headers', () => {
    setup();

    ['Name', 'Unit', 'Last Updated'].forEach((header) => {
      expect(screen.getByText(header)).toBeInTheDocument();
    });
  });

  test('shows the empty state when there are no matching types', () => {
    setup({ data: [] });

    expect(screen.getByText('No matching names found')).toBeInTheDocument();
  });

  test('filters the types by the search query', () => {
    setup({ params: { q: 'sprint' } });

    // HighlightText splits the matched substring into its own node.
    expect(screen.getByText('Sprint')).toBeInTheDocument();
    expect(screen.queryByText('Push-ups')).not.toBeInTheDocument();
  });

  test('filters the types by unit', () => {
    setup({ params: { unit: [TestTypeUnit.REPS] } });

    expect(screen.getByText('Push-ups')).toBeInTheDocument();
    expect(screen.queryByText('Sprint 30m')).not.toBeInTheDocument();
  });

  test('opens the dialog in update mode when a row is clicked', async () => {
    const { user } = setup();

    await user.click(screen.getByText('Sprint 30m'));

    expect(mockOpen).toHaveBeenCalledWith('update-test-type', {
      action: 'Update',
      item: MOCK_TEST_TYPE,
    });
  });

  test('does not open the dialog when a guest clicks a row', async () => {
    const { user } = setup({ perms: { isGuest: true } });

    await user.click(screen.getByText('Sprint 30m'));

    expect(mockOpen).not.toHaveBeenCalled();
  });

  describe('selection', () => {
    const withDelete = { isAdmin: true, can: () => true };

    test('deletes the selected types and reports success', async () => {
      mockRemoveTestType.mockResolvedValue({ success: true });

      const { user } = setup({ perms: withDelete });

      await user.click(
        screen.getByRole('checkbox', { name: 'Select all rows' }),
      );
      await user.click(screen.getByRole('button', { name: /delete/i }));

      await waitFor(() => {
        const ids = mockRemoveTestType.mock.calls.map(([id]) => id);
        expect(ids).toEqual(
          expect.arrayContaining(['type-123', 'type-456']),
        );
      });

      expect(toaster.create).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'success' }),
      );
    });

    test('warns when some deletions fail', async () => {
      mockRemoveTestType
        .mockResolvedValueOnce({ success: true })
        .mockResolvedValueOnce({ success: false, message: 'nope' });

      const { user } = setup({ perms: withDelete });

      await user.click(
        screen.getByRole('checkbox', { name: 'Select all rows' }),
      );
      await user.click(screen.getByRole('button', { name: /delete/i }));

      await waitFor(() => {
        expect(toaster.create).toHaveBeenCalledWith(
          expect.objectContaining({ type: 'warning' }),
        );
      });
    });
  });
});
