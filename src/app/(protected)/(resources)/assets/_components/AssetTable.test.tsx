import { MOCK_ASSET } from '@/test/mocks/asset';
import {
  createPermissionsMock,
  createToasterMock,
  expectNoA11yViolations,
  mockToaster,
  mockUseQueryStates,
  renderWithUI,
  screen,
  setupTestLifecycle,
  waitFor,
} from '@/test/utilities';

import usePermissions, {
  type PermissionsResult,
} from '@/hooks/use-permissions';
import { AssetCategory, AssetCondition } from '@/utils/enum';

import { removeAsset } from '@/actions/asset';
import type { Asset } from '@/drizzle/schema/asset';

import AssetTable from './AssetTable';
import { UpsertAsset } from './UpsertAsset';

vi.mock('@/hooks/use-permissions', () => ({
  default: vi.fn(),
}));

vi.mock('@/actions/asset', () => ({
  removeAsset: vi.fn(),
}));

vi.mock('@/components/ui/toaster', () => createToasterMock());

vi.mock('./UpsertAsset', () => ({
  UpsertAsset: { open: vi.fn(), Viewport: () => null },
}));

describe('AssetTable', () => {
  const mockUsePermissions = vi.mocked(usePermissions);
  const mockRemoveAsset = vi.mocked(removeAsset);
  const mockOpen = vi.mocked(UpsertAsset.open);

  const SECOND_ASSET: Asset = {
    ...MOCK_ASSET,
    asset_id: 'asset-456',
    name: 'Training Cone',
    category: AssetCategory.OTHERS,
    condition: AssetCondition.POOR,
    quantity: 24,
    note: 'Needs replacing',
  };

  const setup = ({
    data = [MOCK_ASSET, SECOND_ASSET],
    can = () => false,
    isGuest = false,
    params = {},
  }: Partial<{
    data: Array<Asset>;
    can: PermissionsResult['can'];
    isGuest: boolean;
    params: Record<string, unknown>;
  }> = {}) => {
    mockUsePermissions.mockReturnValue(createPermissionsMock({ can, isGuest }));
    mockUseQueryStates({
      page: 1,
      q: '',
      category: [],
      condition: [],
      ...params,
    });

    return renderWithUI(<AssetTable data={data} />);
  };

  setupTestLifecycle();

  test('should be accessible', async () => {
    const { container } = setup({});

    await expectNoA11yViolations(container);
  });

  test('renders a row for each asset', () => {
    setup();

    expect(screen.getByText(MOCK_ASSET.name)).toBeInTheDocument();
    expect(screen.getByText(SECOND_ASSET.name)).toBeInTheDocument();
  });

  test('renders the column headers', () => {
    setup();

    [
      'Name',
      'Category',
      'Quantity',
      'Condition',
      'Assigned To',
      'Acquired Date',
      'Last Updated',
      'Note',
    ].forEach((header) => {
      expect(screen.getByText(header)).toBeInTheDocument();
    });
  });

  test('renders the owner, quantity and note of an asset', () => {
    setup({ data: [SECOND_ASSET] });

    expect(screen.getByText(SECOND_ASSET.user!.name)).toBeInTheDocument();
    expect(screen.getByText(String(SECOND_ASSET.quantity))).toBeInTheDocument();
    expect(screen.getByText(SECOND_ASSET.note!)).toBeInTheDocument();
  });

  test('shows the empty state when there are no assets', () => {
    setup({ data: [] });

    expect(screen.getByText('No assets found')).toBeInTheDocument();
  });

  test('filters the assets by the search query', () => {
    setup({ params: { q: 'cone' } });

    // HighlightText splits the matched substring into its own node.
    expect(screen.getByText('Cone', { exact: false })).toBeInTheDocument();
    expect(screen.queryByText(MOCK_ASSET.name)).not.toBeInTheDocument();
  });

  test('filters the assets by category', () => {
    setup({ params: { category: [AssetCategory.EQUIPMENT] } });

    expect(screen.getByText(MOCK_ASSET.name)).toBeInTheDocument();
    expect(screen.queryByText(SECOND_ASSET.name)).not.toBeInTheDocument();
  });

  test('filters the assets by condition', () => {
    setup({ params: { condition: [AssetCondition.POOR] } });

    expect(screen.getByText(SECOND_ASSET.name)).toBeInTheDocument();
    expect(screen.queryByText(MOCK_ASSET.name)).not.toBeInTheDocument();
  });

  describe('row click', () => {
    test('opens the dialog in update mode', async () => {
      const { user } = setup();

      await user.click(screen.getByText(MOCK_ASSET.name));

      expect(mockOpen).toHaveBeenCalledWith('update-asset', {
        action: 'Update',
        item: MOCK_ASSET,
      });
    });

    test('does nothing for a guest', async () => {
      const { user } = setup({ isGuest: true });

      await user.click(screen.getByText(MOCK_ASSET.name));

      expect(mockOpen).not.toHaveBeenCalled();
    });
  });

  describe('selection', () => {
    const canDelete: PermissionsResult['can'] = (_, action) =>
      action === 'delete';

    test('deletes the selected assets and reports success', async () => {
      mockRemoveAsset.mockResolvedValue({ success: true, message: 'Removed' });

      const { user } = setup({ can: canDelete });

      await user.click(
        screen.getByRole('checkbox', { name: 'Select all rows' }),
      );
      await user.click(screen.getByRole('button', { name: /delete/i }));

      await waitFor(() => {
        const ids = mockRemoveAsset.mock.calls.map(([id]) => id);
        expect(ids).toEqual(
          expect.arrayContaining([MOCK_ASSET.asset_id, SECOND_ASSET.asset_id]),
        );
      });

      expect(mockToaster.create).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'success' }),
      );
    });

    test('warns when some deletions fail', async () => {
      mockRemoveAsset
        .mockResolvedValueOnce({ success: true, message: 'Removed' })
        .mockResolvedValueOnce({ success: false, message: 'nope' });

      const { user } = setup({ can: canDelete });

      await user.click(
        screen.getByRole('checkbox', { name: 'Select all rows' }),
      );
      await user.click(screen.getByRole('button', { name: /delete/i }));

      await waitFor(() => {
        expect(mockToaster.create).toHaveBeenCalledWith(
          expect.objectContaining({ type: 'warning' }),
        );
      });
    });
  });
});
