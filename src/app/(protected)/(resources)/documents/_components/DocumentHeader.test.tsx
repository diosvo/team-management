import usePermissions from '@/hooks/use-permissions';
import {
  createPermissionsMock,
  renderWithUI,
  screen,
  setupTestLifecycle,
} from '@/test/utilities';

import DocumentHeader from './DocumentHeader';
import { UpsertDocument } from './UpsertDocument';

vi.mock('@/hooks/use-permissions', () => ({
  default: vi.fn(),
}));

vi.mock('./UpsertDocument', () => ({
  UpsertDocument: { open: vi.fn() },
}));

describe('DocumentHeader', () => {
  const mockUsePermissions = vi.mocked(usePermissions);
  const mockOpen = vi.mocked(UpsertDocument.open);

  const setup = (canCreate = false) => {
    mockUsePermissions.mockReturnValue(
      createPermissionsMock({ can: () => canCreate }),
    );

    return renderWithUI(<DocumentHeader />);
  };

  setupTestLifecycle();

  test('renders the page title', () => {
    setup();

    expect(screen.getByText('Documents')).toBeInTheDocument();
  });

  test('renders the add button when the user can create', () => {
    setup(true);

    expect(screen.getByRole('button', { name: /add/i })).toBeInTheDocument();
  });

  test('hides the add button when the user cannot create', () => {
    setup(false);

    expect(
      screen.queryByRole('button', { name: /add/i }),
    ).not.toBeInTheDocument();
  });

  test('opens the dialog in add mode when the add button is clicked', async () => {
    const { user } = setup(true);

    await user.click(screen.getByRole('button', { name: /add/i }));

    expect(mockOpen).toHaveBeenCalledWith('add-document', {
      action: 'Add',
      item: { document_id: '' },
    });
  });
});
