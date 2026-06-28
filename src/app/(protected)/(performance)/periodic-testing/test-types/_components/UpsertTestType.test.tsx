import { Mock } from 'vitest';

import { act, renderWithUI, screen, waitFor } from '@/test/utilities';

import { upsertTestType } from '@/actions/test-type';

import { UpsertTestType } from './UpsertTestType';

vi.mock('@/actions/test-type', () => ({
  upsertTestType: vi.fn(),
}));

vi.mock('@/components/ui/toaster', () => ({
  toaster: {
    create: vi.fn(() => 'toast-id'),
    update: vi.fn(),
  },
}));

describe('UpsertTestType', () => {
  const mockUpsertTestType = upsertTestType as unknown as Mock;

  const open = async (
    action: 'Add' | 'Update' = 'Add',
    item: Record<string, unknown> = { type_id: '' },
  ) => {
    const view = renderWithUI(<UpsertTestType.Viewport />);

    // Match the id the component closes on submit for the "Update" action.
    const id = action === 'Update' ? 'update-test-type' : 'add-test-type';
    await act(async () => {
      UpsertTestType.open(id, { action, item });
    });

    return view;
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    act(() => {
      UpsertTestType.removeAll();
    });
  });

  test('renders the dialog title and fields for the given action', async () => {
    await open('Add');

    expect(await screen.findByText('Add Test Type')).toBeInTheDocument();
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Unit')).toBeInTheDocument();
    expect(screen.getByText('Seconds')).toBeInTheDocument();
  });

  test('keeps the submit button disabled while the name is empty', async () => {
    await open('Add');

    const submit = await screen.findByRole('button', { name: /add/i });

    expect(submit).toBeDisabled();
  });

  test('submits the entered values through upsertTestType', async () => {
    mockUpsertTestType.mockResolvedValue({ success: true, message: 'Saved' });

    const view = await open('Update', { type_id: 'type-123', name: 'Sprint' });
    const { user } = view;

    const submit = await screen.findByRole('button', { name: /update/i });
    await waitFor(() => expect(submit).toBeEnabled());
    await user.click(submit);

    await waitFor(() => {
      expect(mockUpsertTestType).toHaveBeenCalledWith(
        'type-123',
        expect.objectContaining({ name: 'Sprint' }),
      );
    });
  });
});
