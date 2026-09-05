import { MOCK_LOCATION, MOCK_LOCATION_2 } from '@/test/mocks/location';
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

import { removeLocation } from '@/actions/location';
import type { Location } from '@/drizzle/schema';

import LocationTable from './LocationTable';
import { UpsertLocation } from './UpsertLocation';

vi.mock('@/hooks/use-permissions', () => ({
  default: vi.fn(),
}));

vi.mock('@/actions/location', () => ({
  removeLocation: vi.fn(),
}));

vi.mock('@/components/ui/toaster', () => createToasterMock());

vi.mock('./UpsertLocation', () => ({
  UpsertLocation: { open: vi.fn(), Viewport: () => null },
}));

describe('LocationTable', () => {
  const mockUsePermissions = vi.mocked(usePermissions);
  const mockRemoveLocation = vi.mocked(removeLocation);
  const mockOpen = vi.mocked(UpsertLocation.open);

  const setup = ({
    locations = [MOCK_LOCATION, MOCK_LOCATION_2],
    can = () => false,
    isGuest = false,
    params = {},
  }: Partial<{
    locations: Array<Location>;
    can: PermissionsResult['can'];
    isGuest: boolean;
    params: Record<string, unknown>;
  }> = {}) => {
    mockUsePermissions.mockReturnValue(createPermissionsMock({ can, isGuest }));
    mockUseQueryStates({ page: 1, q: '', ...params });

    return renderWithUI(<LocationTable locations={locations} />);
  };

  setupTestLifecycle();

  test('should be accessible', async () => {
    const { container } = setup({});

    await expectNoA11yViolations(container);
  });

  test('renders a row for each location', () => {
    setup();

    expect(screen.getByText(MOCK_LOCATION.name)).toBeInTheDocument();
    expect(screen.getByText(MOCK_LOCATION_2.name)).toBeInTheDocument();
    expect(screen.getByText(MOCK_LOCATION.address)).toBeInTheDocument();
  });

  test('renders the column headers', () => {
    setup();

    ['Name', 'Address', 'Last Updated'].forEach((header) => {
      expect(screen.getByText(header)).toBeInTheDocument();
    });
  });

  test('links each name out to the location', () => {
    setup({ locations: [MOCK_LOCATION] });

    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      expect.stringContaining(encodeURIComponent(MOCK_LOCATION.name)),
    );
  });

  test('shows the empty state when there are no locations', () => {
    setup({ locations: [] });

    expect(screen.getByText('No locations found')).toBeInTheDocument();
  });

  test('filters the locations by name', () => {
    setup({ params: { q: 'bien hoa' } });

    // HighlightText splits the matched substring into its own node.
    expect(screen.getByText('Bien Hoa', { exact: false })).toBeInTheDocument();
    expect(screen.queryByText(MOCK_LOCATION.name)).not.toBeInTheDocument();
  });

  test('filters the locations by address', () => {
    setup({ params: { q: 'Ho Chi Minh' } });

    expect(screen.getByText(MOCK_LOCATION.name)).toBeInTheDocument();
    expect(screen.queryByText(MOCK_LOCATION_2.name)).not.toBeInTheDocument();
  });

  describe('row click', () => {
    test('opens the dialog in update mode', async () => {
      const { user } = setup();

      await user.click(screen.getByText(MOCK_LOCATION.address));

      expect(mockOpen).toHaveBeenCalledWith('update-location', {
        action: 'Update',
        item: MOCK_LOCATION,
      });
    });

    test('does nothing for a guest', async () => {
      const { user } = setup({ isGuest: true });

      await user.click(screen.getByText(MOCK_LOCATION.address));

      expect(mockOpen).not.toHaveBeenCalled();
    });
  });

  describe('selection', () => {
    const canDelete: PermissionsResult['can'] = (_, action) =>
      action === 'delete';

    test('deletes the selected locations and reports success', async () => {
      mockRemoveLocation.mockResolvedValue({
        success: true,
        message: 'Removed',
      });

      const { user } = setup({ can: canDelete });

      await user.click(
        screen.getByRole('checkbox', { name: 'Select all rows' }),
      );
      await user.click(screen.getByRole('button', { name: /delete/i }));

      await waitFor(() => {
        const ids = mockRemoveLocation.mock.calls.map(([id]) => id);
        expect(ids).toEqual(
          expect.arrayContaining([
            MOCK_LOCATION.location_id,
            MOCK_LOCATION_2.location_id,
          ]),
        );
      });

      expect(mockToaster.create).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'success' }),
      );
    });

    test('warns when some deletions fail', async () => {
      mockRemoveLocation
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
