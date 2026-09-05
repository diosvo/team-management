import { MOCK_ASSET } from '@/test/mocks/asset';
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

import { AssetCondition } from '@/utils/enum';

import { upsertAsset } from '@/actions/asset';

import { UpsertAsset } from './UpsertAsset';

vi.mock('@/actions/asset', () => ({
  upsertAsset: vi.fn(),
}));

vi.mock('@/components/ui/toaster', () => createToasterMock());

// The owner picker loads players of its own accord; it has its own tests.
vi.mock('@/components/user/PlayerSelection', () => ({
  OnePlayerSelection: ({ label }: { label: string }) => (
    <div data-testid="one-player-selection">{label}</div>
  ),
}));

describe('UpsertAsset', () => {
  const mockUpsertAsset = vi.mocked(upsertAsset);

  const EXISTING_ASSET = {
    asset_id: MOCK_ASSET.asset_id,
    name: MOCK_ASSET.name,
    category: MOCK_ASSET.category,
    quantity: MOCK_ASSET.quantity,
    condition: MOCK_ASSET.condition,
    assigned_to: MOCK_ASSET.assigned_to,
    acquired_date: MOCK_ASSET.acquired_date,
    note: MOCK_ASSET.note,
  };

  const open = async (
    action: 'Add' | 'Update' = 'Add',
    item: Record<string, unknown> = { asset_id: '' },
  ) => {
    const view = renderWithUI(<UpsertAsset.Viewport />);

    // Match the id the component closes on submit for the "Update" action.
    const id = action === 'Update' ? 'update-asset' : 'add-asset';
    await act(async () => {
      UpsertAsset.open(id, { action, item });
    });

    return view;
  };

  setupTestLifecycle();

  afterEach(() => {
    act(() => {
      UpsertAsset.removeAll();
    });
  });

  test('should be accessible', async () => {
    await open();

    await expectNoA11yViolations();
  });

  test('renders the dialog title and fields for the given action', async () => {
    await open('Add');

    expect(await screen.findByText('Add Item')).toBeInTheDocument();
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Quantity')).toBeInTheDocument();
    expect(screen.getByText('Acquired date')).toBeInTheDocument();
    expect(screen.getByText('Category')).toBeInTheDocument();
    expect(screen.getByText('Condition')).toBeInTheDocument();
    expect(screen.getByText('Note')).toBeInTheDocument();
  });

  test('renders the owner picker', async () => {
    await open('Add');

    expect(await screen.findByTestId('one-player-selection')).toHaveTextContent(
      'owner',
    );
  });

  test('hides the obsolete condition when adding', async () => {
    await open('Add');

    await screen.findByText('Add Item');

    expect(screen.getByLabelText(/obsolete/i)).not.toBeVisible();
  });

  test('offers the obsolete condition when updating', async () => {
    await open('Update', EXISTING_ASSET);

    await screen.findByText('Update Item');

    expect(screen.getByLabelText(/obsolete/i)).toBeVisible();
  });

  test('keeps the submit button disabled while the form is untouched', async () => {
    await open('Update', EXISTING_ASSET);

    expect(
      await screen.findByRole('button', { name: /update/i }),
    ).toBeDisabled();
  });

  test('submits the entered values through upsertAsset', async () => {
    mockUpsertAsset.mockResolvedValue({ success: true, message: 'Saved' });

    const { user } = await open('Update', EXISTING_ASSET);

    const name = await screen.findByPlaceholderText('Ball #');
    await user.type(name, ' v2');

    const submit = await screen.findByRole('button', { name: /update/i });
    await waitFor(() => expect(submit).toBeEnabled());
    await user.click(submit);

    await waitFor(() => {
      expect(mockUpsertAsset).toHaveBeenCalledWith(
        MOCK_ASSET.asset_id,
        expect.objectContaining({
          name: `${MOCK_ASSET.name} v2`,
          condition: AssetCondition.GOOD,
        }),
      );
    });
  });

  test('reports a failed save through the toaster', async () => {
    mockUpsertAsset.mockResolvedValue({
      success: false,
      message: 'Quantity must be positive',
    });

    const { user } = await open('Update', EXISTING_ASSET);

    const name = await screen.findByPlaceholderText('Ball #');
    await user.type(name, ' v2');

    const submit = await screen.findByRole('button', { name: /update/i });
    await waitFor(() => expect(submit).toBeEnabled());
    await user.click(submit);

    await waitFor(() => {
      expect(mockToaster.update).toHaveBeenCalledWith(
        'toast-id',
        expect.objectContaining({
          type: 'error',
          title: 'Quantity must be positive',
        }),
      );
    });
  });
});
