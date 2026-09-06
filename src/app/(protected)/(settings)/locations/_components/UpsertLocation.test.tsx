import { MOCK_LOCATION } from '@/test/mocks/location';
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

import { upsertLocation } from '@/actions/location';

import { UpsertLocation } from './UpsertLocation';

vi.mock('@/actions/location', () => ({
  upsertLocation: vi.fn(),
}));

vi.mock('@/components/ui/toaster', () => createToasterMock());

describe('UpsertLocation', () => {
  const mockUpsertLocation = vi.mocked(upsertLocation);

  const EXISTING_LOCATION = {
    location_id: MOCK_LOCATION.location_id,
    name: MOCK_LOCATION.name,
    address: MOCK_LOCATION.address,
  };

  const open = async (
    action: 'Add' | 'Update' = 'Add',
    item: Record<string, unknown> = { location_id: '' },
  ) => {
    const view = renderWithUI(<UpsertLocation.Viewport />);

    // Match the id the component closes on submit for the "Update" action.
    const id = action === 'Update' ? 'update-location' : 'add-location';
    await act(async () => {
      UpsertLocation.open(id, { action, item });
    });

    return view;
  };

  setupTestLifecycle();

  afterEach(() => {
    act(() => {
      UpsertLocation.removeAll();
    });
  });

  test('should be accessible', async () => {
    await open();

    await expectNoA11yViolations();
  });

  test('renders the dialog title and fields for the given action', async () => {
    await open('Add');

    expect(await screen.findByText('Add Location')).toBeInTheDocument();
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Address')).toBeInTheDocument();
  });

  test('renders the update title when updating', async () => {
    await open('Update', EXISTING_LOCATION);

    expect(await screen.findByText('Update Location')).toBeInTheDocument();
  });

  test('prefills the fields when updating', async () => {
    await open('Update', EXISTING_LOCATION);

    expect(await screen.findByPlaceholderText('Headquarters')).toHaveValue(
      MOCK_LOCATION.name,
    );
    expect(
      screen.getByPlaceholderText('123 Main St, City, Country'),
    ).toHaveValue(MOCK_LOCATION.address);
  });

  test('keeps the submit button disabled until the form is valid', async () => {
    await open('Add');

    expect(await screen.findByRole('button', { name: /add/i })).toBeDisabled();
  });

  test('submits the entered values through upsertLocation', async () => {
    mockUpsertLocation.mockResolvedValue({ success: true, message: 'Saved' });

    const { user } = await open('Update', EXISTING_LOCATION);

    const name = await screen.findByPlaceholderText('Headquarters');
    await user.type(name, ' Annex');

    const submit = await screen.findByRole('button', { name: /update/i });
    await waitFor(() => expect(submit).toBeEnabled());
    await user.click(submit);

    await waitFor(() => {
      expect(mockUpsertLocation).toHaveBeenCalledWith(
        MOCK_LOCATION.location_id,
        expect.objectContaining({
          name: `${MOCK_LOCATION.name} Annex`,
          address: MOCK_LOCATION.address,
        }),
      );
    });
  });

  test('reports a failed save through the toaster', async () => {
    mockUpsertLocation.mockResolvedValue({
      success: false,
      message: 'Name already taken',
    });

    const { user } = await open('Update', EXISTING_LOCATION);

    const name = await screen.findByPlaceholderText('Headquarters');
    await user.type(name, ' Annex');

    const submit = await screen.findByRole('button', { name: /update/i });
    await waitFor(() => expect(submit).toBeEnabled());
    await user.click(submit);

    await waitFor(() => {
      expect(mockToaster.update).toHaveBeenCalledWith(
        'toast-id',
        expect.objectContaining({
          type: 'error',
          title: 'Name already taken',
        }),
      );
    });
  });
});
