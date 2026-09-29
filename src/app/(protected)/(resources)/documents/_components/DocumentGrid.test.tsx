import { DocumentType, DriveKind } from '@/utils/enum';

import { getAlbumItems, removeDocument } from '@/actions/document';
import type { Document } from '@/drizzle/schema/document';
import usePermissions, {
  type PermissionsResult,
} from '@/hooks/use-permissions';
import {
  MOCK_DOCUMENT,
  MOCK_PHOTO,
  MOCK_TACTIC,
  MOCK_VIDEO,
} from '@/test/mocks/document';
import {
  createPermissionsMock,
  createToasterMock,
  expectNoA11yViolations,
  fireEvent,
  mockToaster,
  mockUseQueryStates,
  renderWithUI,
  screen,
  setupTestLifecycle,
  waitFor,
} from '@/test/utilities';

import DocumentGrid from './DocumentGrid';
import { DocumentPreview } from './DocumentPreview';
import { UpsertDocument } from './UpsertDocument';

vi.mock('@/hooks/use-permissions', () => ({
  default: vi.fn(),
}));

vi.mock('@/actions/document', () => ({
  getAlbumItems: vi.fn(),
  removeDocument: vi.fn(),
}));

vi.mock('@/components/ui/toaster', () => createToasterMock());

vi.mock('./UpsertDocument', () => ({
  UpsertDocument: { open: vi.fn(), Viewport: () => null },
}));

vi.mock('./DocumentPreview', () => ({
  DocumentPreview: { open: vi.fn(), Viewport: () => null },
}));

describe('DocumentGrid', () => {
  const mockUsePermissions = vi.mocked(usePermissions);
  const mockRemoveDocument = vi.mocked(removeDocument);
  const mockOpenEditor = vi.mocked(UpsertDocument.open);
  const mockOpenPreview = vi.mocked(DocumentPreview.open);

  const setup = ({
    data = [MOCK_DOCUMENT, MOCK_VIDEO],
    can = () => false,
    params = {},
  }: Partial<{
    data: Array<Document>;
    can: PermissionsResult['can'];
    params: Record<string, unknown>;
  }> = {}) => {
    mockUsePermissions.mockReturnValue(createPermissionsMock({ can }));
    mockUseQueryStates({
      page: 1,
      q: '',
      type: [],
      from: '',
      to: '',
      ...params,
    });

    return renderWithUI(<DocumentGrid data={data} />);
  };

  setupTestLifecycle();

  test('should be accessible', async () => {
    const { container } = setup();

    await expectNoA11yViolations(container);
  });

  test('renders a card for each document', () => {
    setup();

    expect(screen.getByText(MOCK_DOCUMENT.title)).toBeInTheDocument();
    expect(screen.getByText(MOCK_VIDEO.title)).toBeInTheDocument();
  });

  test('links every card to its Drive url in a new tab', () => {
    setup({ data: [MOCK_DOCUMENT] });

    const links = screen.getAllByRole('link', { name: /drive/i });
    links.forEach((link) => {
      expect(link).toHaveAttribute('href', MOCK_DOCUMENT.url);
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
    });
  });

  test('renders the type badge, date and note', () => {
    setup({ data: [MOCK_VIDEO] });

    expect(screen.getByText('Video')).toBeInTheDocument();
    expect(screen.getByText('20/11/2025')).toBeInTheDocument();
    expect(screen.getByText(MOCK_VIDEO.note!)).toBeInTheDocument();
  });

  test('shows the onboarding empty state when there are no documents at all', () => {
    setup({ data: [] });

    expect(screen.getByText('No documents found')).toBeInTheDocument();
    expect(
      screen.getByText(/link a public google drive folder/i),
    ).toBeInTheDocument();
  });

  test('shows the filter hint when filters hide everything', () => {
    setup({ params: { q: 'nothing matches' } });

    expect(screen.getByText('No documents found')).toBeInTheDocument();
    expect(screen.getByText(/adjusting your filters/i)).toBeInTheDocument();
  });

  test('filters the documents by the search query', () => {
    setup({ params: { q: 'highlights' } });

    expect(
      screen.getByText('Highlights', { exact: false }),
    ).toBeInTheDocument();
    expect(screen.queryByText(MOCK_DOCUMENT.title)).not.toBeInTheDocument();
  });

  test('filters the documents by type', () => {
    setup({ params: { type: [DocumentType.ALBUM] } });

    expect(screen.getByText(MOCK_DOCUMENT.title)).toBeInTheDocument();
    expect(screen.queryByText(MOCK_VIDEO.title)).not.toBeInTheDocument();
  });

  test('filters the documents by the event date range', () => {
    setup({ params: { from: '2025-01-01', to: '2025-12-31' } });

    expect(screen.getByText(MOCK_VIDEO.title)).toBeInTheDocument();
    expect(screen.queryByText(MOCK_DOCUMENT.title)).not.toBeInTheDocument();
  });

  describe('in Vietnamese', () => {
    test('translates the card actions and type badge', () => {
      mockUsePermissions.mockReturnValue(
        createPermissionsMock({ can: () => false }),
      );
      mockUseQueryStates({ page: 1, q: '', type: [], from: '', to: '' });
      renderWithUI(<DocumentGrid data={[MOCK_VIDEO]} />, { locale: 'vi' });

      expect(screen.getByText('Video')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: `Phát ${MOCK_VIDEO.title}` }),
      ).toBeInTheDocument();
      expect(screen.getByText('Mở trong Drive')).toBeInTheDocument();
    });

    test('translates the empty state', () => {
      mockUsePermissions.mockReturnValue(
        createPermissionsMock({ can: () => false }),
      );
      mockUseQueryStates({ page: 1, q: '', type: [], from: '', to: '' });
      renderWithUI(<DocumentGrid data={[]} />, { locale: 'vi' });

      expect(
        screen.getByText('Không tìm thấy tài liệu nào'),
      ).toBeInTheDocument();
    });
  });

  describe('previews', () => {
    test.each([
      {
        label: 'video',
        item: MOCK_VIDEO,
        name: /^play/i,
        kind: DriveKind.FILE,
      },
      {
        label: 'tactic',
        item: MOCK_TACTIC,
        name: /^play/i,
        kind: DriveKind.FILE,
      },
      {
        label: 'album',
        item: MOCK_DOCUMENT,
        name: /^preview/i,
        kind: DriveKind.FOLDER,
      },
      {
        label: 'photo',
        item: MOCK_PHOTO,
        name: /^preview/i,
        kind: DriveKind.FILE,
      },
    ])(
      'opens the $label inline with its Drive link',
      async ({ item, name, kind }) => {
        const listing = Promise.resolve(null);
        vi.mocked(getAlbumItems).mockReturnValue(listing);
        const { user } = setup({ data: [item] });

        // Both the thumbnail overlay and the footer button open the preview.
        const [thumbnail, footer] = screen.getAllByRole('button', { name });
        await user.click(thumbnail!);
        await user.click(footer!);

        expect(mockOpenPreview).toHaveBeenCalledTimes(2);
        // Only albums start a folder listing, once per click.
        expect(vi.mocked(getAlbumItems).mock.calls).toEqual(
          kind === DriveKind.FOLDER ? [[item.drive_id], [item.drive_id]] : [],
        );
        expect(mockOpenPreview).toHaveBeenCalledWith('preview-document', {
          title: item.title,
          link: { id: item.drive_id, kind },
          type: item.type,
          items: kind === DriveKind.FOLDER ? listing : undefined,
        });
      },
    );

    test('falls back to the Drive link when the url is not a Drive link', () => {
      const item = { ...MOCK_DOCUMENT, url: 'https://example.com/album' };
      setup({ data: [item] });

      expect(
        screen.queryByRole('button', { name: /play|preview/i }),
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole('link', {
          name: `Open ${item.title} in Google Drive`,
        }),
      ).toHaveAttribute('href', item.url);
    });

    test('shows the file thumbnail and swaps to the type icon when it fails', () => {
      const { container } = setup({ data: [MOCK_PHOTO] });

      const image = container.querySelector('img');
      expect(image).toHaveAttribute(
        'src',
        expect.stringContaining(`id=${MOCK_PHOTO.drive_id}`),
      );

      fireEvent.error(image!);

      expect(container.querySelector('img')).not.toBeInTheDocument();
    });

    test('shows no thumbnail for albums', () => {
      const { container } = setup({ data: [MOCK_DOCUMENT] });

      expect(container.querySelector('img')).not.toBeInTheDocument();
    });
  });

  describe('editing', () => {
    test('opens the dialog in update mode from the edit button', async () => {
      const { user } = setup({
        data: [MOCK_DOCUMENT],
        can: (_, action) => action === 'edit',
      });

      await user.click(screen.getByRole('button', { name: /edit/i }));

      expect(mockOpenEditor).toHaveBeenCalledWith('update-document', {
        action: 'Update',
        item: MOCK_DOCUMENT,
      });
    });

    test('hides the edit button without permission', () => {
      setup({ data: [MOCK_DOCUMENT] });

      expect(
        screen.queryByRole('button', { name: /edit/i }),
      ).not.toBeInTheDocument();
    });
  });

  describe('selection', () => {
    const canDelete: PermissionsResult['can'] = (_, action) =>
      action === 'delete';

    test('hides the checkboxes without delete permission', () => {
      setup();

      expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    });

    test('unselects a document when its checkbox is cleared', async () => {
      const { user } = setup({ data: [MOCK_DOCUMENT], can: canDelete });

      const checkbox = screen.getByRole('checkbox', {
        name: 'Select document',
      });
      await user.click(checkbox);
      expect(checkbox).toBeChecked();

      await user.click(checkbox);
      expect(checkbox).not.toBeChecked();
    });

    test('deletes the selected documents and reports success', async () => {
      mockRemoveDocument.mockResolvedValue({
        success: true,
        message: 'Removed',
      });

      const { user } = setup({ can: canDelete });

      for (const checkbox of screen.getAllByRole('checkbox', {
        name: 'Select document',
      })) {
        await user.click(checkbox);
      }
      await user.click(screen.getByRole('button', { name: /delete/i }));

      await waitFor(() => {
        const ids = mockRemoveDocument.mock.calls.map(([id]) => id);
        expect(ids).toEqual(
          expect.arrayContaining([
            MOCK_DOCUMENT.document_id,
            MOCK_VIDEO.document_id,
          ]),
        );
      });

      await waitFor(() =>
        expect(mockToaster.update).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            type: 'success',
            title: 'Successfully deleted 2 documents.',
          }),
        ),
      );
    });

    test('warns when some deletions fail', async () => {
      mockRemoveDocument
        .mockResolvedValueOnce({ success: true, message: 'Removed' })
        .mockResolvedValueOnce({ success: false, message: 'nope' });

      const { user } = setup({ can: canDelete });

      for (const checkbox of screen.getAllByRole('checkbox', {
        name: 'Select document',
      })) {
        await user.click(checkbox);
      }
      await user.click(screen.getByRole('button', { name: /delete/i }));

      await waitFor(() => {
        expect(mockToaster.update).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            type: 'warning',
            title: 'Deleted 1 of 2 documents; 1 failed.',
            description: 'nope',
          }),
        );
      });
    });
  });
});
