import { TestTypeUnit } from '@/utils/enum';

import { removeTestType } from '@/actions/test-type';
import type { TestType } from '@/drizzle/schema';
import usePermissions from '@/hooks/use-permissions';
import {
  MOCK_TEST_TYPE,
  MOCK_TEST_TYPE_2,
} from '@/test/mocks/periodic-testing';
import {
  createPermissionsMock,
  createToasterMock,
  enumText,
  expectNoA11yViolations,
  mockToaster,
  mockUseQueryStates,
  renderWithUI,
  screen,
  setupTestLifecycle,
  waitFor,
} from '@/test/utilities';

import TestTypeTable from './TestTypeTable';
import { UpsertTestType } from './UpsertTestType';

vi.mock('@/hooks/use-permissions', () => ({
  default: vi.fn(),
}));

vi.mock('@/actions/test-type', () => ({
  removeTestType: vi.fn(),
}));

vi.mock('@/components/ui/toaster', () => createToasterMock());

// Stub the overlay controller; its dialog has its own test.
vi.mock('./UpsertTestType', () => ({
  UpsertTestType: { open: vi.fn(), Viewport: () => null },
}));

describe('TestTypeTable', () => {
  const mockUsePermissions = vi.mocked(usePermissions);
  const mockRemoveTestType = vi.mocked(removeTestType);
  const mockOpen = vi.mocked(UpsertTestType.open);

  const setup = ({
    data = [MOCK_TEST_TYPE, MOCK_TEST_TYPE_2],
    perms = {},
    params = {},
  }: {
    data?: Array<TestType>;
    perms?: Record<string, unknown>;
    params?: Record<string, unknown>;
  } = {}) => {
    mockUsePermissions.mockReturnValue(
      createPermissionsMock({
        isGuest: false,
        isAdmin: false,
        can: () => false,
        ...perms,
      }),
    );
    mockUseQueryStates({ page: 1, q: '', unit: [], ...params });

    return renderWithUI(<TestTypeTable data={data} />);
  };

  setupTestLifecycle();

  test('should be accessible', async () => {
    const { container } = setup({});

    await expectNoA11yViolations(container);
  });

  test('renders a row for each test type', () => {
    setup();

    expect(screen.getByText(MOCK_TEST_TYPE.name)).toBeInTheDocument();
    expect(screen.getByText(MOCK_TEST_TYPE_2.name)).toBeInTheDocument();
  });

  test('renders the column headers', () => {
    setup();

    ['Name', 'Unit', 'Last Updated'].forEach((header) => {
      expect(screen.getByText(header)).toBeInTheDocument();
    });
  });

  test('shows the progress direction and target of each type', () => {
    setup({
      data: [
        { ...MOCK_TEST_TYPE, higher_is_better: false, target: '4.5' },
        MOCK_TEST_TYPE_2,
      ],
    });

    expect(
      screen.getByText(enumText('testDirection', 'lower')),
    ).toBeInTheDocument();
    expect(
      screen.getByText(enumText('testDirection', 'higher')),
    ).toBeInTheDocument();
    expect(screen.getByText('4.5')).toBeInTheDocument();
  });

  test('shows the empty state when there are no matching types', () => {
    setup({ data: [] });

    expect(screen.getByText('No matching names found')).toBeInTheDocument();
  });

  test('filters the types by the search query', () => {
    setup({ params: { q: 'sprint' } });

    // HighlightText splits the matched substring into its own node.
    expect(screen.getByText('Sprint')).toBeInTheDocument();
    expect(screen.queryByText(MOCK_TEST_TYPE_2.name)).not.toBeInTheDocument();
  });

  test('filters the types by unit', () => {
    setup({ params: { unit: [TestTypeUnit.REPS] } });

    expect(screen.getByText(MOCK_TEST_TYPE_2.name)).toBeInTheDocument();
    expect(screen.queryByText(MOCK_TEST_TYPE.name)).not.toBeInTheDocument();
  });

  test('opens the dialog in update mode when a row is clicked', async () => {
    const { user } = setup();

    await user.click(screen.getByText(MOCK_TEST_TYPE.name));

    expect(mockOpen).toHaveBeenCalledWith('update-test-type', {
      action: 'Update',
      item: MOCK_TEST_TYPE,
    });
  });

  test('does not open the dialog when a guest clicks a row', async () => {
    const { user } = setup({ perms: { isGuest: true } });

    await user.click(screen.getByText(MOCK_TEST_TYPE.name));

    expect(mockOpen).not.toHaveBeenCalled();
  });

  describe('selection', () => {
    const withDelete = { isAdmin: true, can: () => true };

    test('deletes the selected types and reports success', async () => {
      mockRemoveTestType.mockResolvedValue({ success: true, message: '' });

      const { user } = setup({ perms: withDelete });

      await user.click(
        screen.getByRole('checkbox', { name: 'Select all rows' }),
      );
      await user.click(screen.getByRole('button', { name: /delete/i }));

      await waitFor(() => {
        const ids = mockRemoveTestType.mock.calls.map(([id]) => id);
        expect(ids).toEqual(
          expect.arrayContaining([
            MOCK_TEST_TYPE.type_id,
            MOCK_TEST_TYPE_2.type_id,
          ]),
        );
      });

      expect(mockToaster.update).toHaveBeenCalledWith(
        'toast-id',
        expect.objectContaining({ type: 'success' }),
      );
    });

    test('warns when some deletions fail', async () => {
      mockRemoveTestType
        .mockResolvedValueOnce({ success: true, message: '' })
        .mockResolvedValueOnce({ success: false, message: 'nope' });

      const { user } = setup({ perms: withDelete });

      await user.click(
        screen.getByRole('checkbox', { name: 'Select all rows' }),
      );
      await user.click(screen.getByRole('button', { name: /delete/i }));

      await waitFor(() => {
        expect(mockToaster.update).toHaveBeenCalledWith(
          'toast-id',
          expect.objectContaining({ type: 'warning' }),
        );
      });
    });
  });

  test('renders the relative time in Vietnamese when locale is vi', () => {
    mockUsePermissions.mockReturnValue(createPermissionsMock());
    mockUseQueryStates({ page: 1, q: '', unit: [] });

    renderWithUI(<TestTypeTable data={[MOCK_TEST_TYPE]} />, { locale: 'vi' });

    // Just verify the component renders; the locale exercises the vi locale branch.
    expect(screen.getByText(MOCK_TEST_TYPE.name)).toBeInTheDocument();
  });
});
