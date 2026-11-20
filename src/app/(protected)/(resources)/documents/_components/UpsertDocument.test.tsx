import { DocumentType } from '@/utils/enum';

import { upsertDocument } from '@/actions/document';
import {
  MOCK_DOCUMENT,
  MOCK_DRIVE_FILE_ID,
  MOCK_DRIVE_FOLDER_ID,
} from '@/test/mocks/document';
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

import { UpsertDocument } from './UpsertDocument';

vi.mock('@/actions/document', () => ({
  upsertDocument: vi.fn(),
}));

vi.mock('@/components/ui/toaster', () => createToasterMock());

describe('UpsertDocument', () => {
  const mockUpsertDocument = vi.mocked(upsertDocument);

  const EXISTING_DOCUMENT = {
    document_id: MOCK_DOCUMENT.document_id,
    title: MOCK_DOCUMENT.title,
    url: MOCK_DOCUMENT.url,
    type: MOCK_DOCUMENT.type,
    event_date: MOCK_DOCUMENT.event_date,
    note: MOCK_DOCUMENT.note,
  };

  const open = async (
    action: 'Add' | 'Update' = 'Add',
    item: Record<string, unknown> = { document_id: '' },
  ) => {
    const view = renderWithUI(<UpsertDocument.Viewport />);

    const id = action === 'Update' ? 'update-document' : 'add-document';
    await act(async () => {
      UpsertDocument.open(id, { action, item });
    });

    return view;
  };

  const linkInput = () =>
    screen.findByPlaceholderText(/drive\.google\.com\/drive\/folders/);

  setupTestLifecycle();

  afterEach(() => {
    act(() => {
      UpsertDocument.removeAll();
    });
  });

  test('should be accessible', async () => {
    await open();

    await expectNoA11yViolations();
  });

  test('renders the dialog title and fields for the given action', async () => {
    await open('Add');

    expect(await screen.findByText('Add Document')).toBeInTheDocument();
    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Google Drive link')).toBeInTheDocument();
    expect(screen.getByText('Type')).toBeInTheDocument();
    expect(screen.getByText('Event date')).toBeInTheDocument();
    expect(screen.getByText('Note')).toBeInTheDocument();
  });

  test('explains that the link must be public and nothing is uploaded', async () => {
    await open('Add');

    expect(
      await screen.findByText(/anyone with the link/i),
    ).toBeInTheDocument();
  });

  test('keeps the submit button disabled while the form is untouched', async () => {
    await open('Update', EXISTING_DOCUMENT);

    expect(
      await screen.findByRole('button', { name: /update/i }),
    ).toBeDisabled();
  });

  test('keeps the form invalid until the link is a Google Drive link', async () => {
    const { user } = await open('Add');

    await user.type(
      await screen.findByPlaceholderText('Season opener highlights'),
      'Away game photos',
    );
    const input = await linkInput();
    await user.type(input, 'https://example.com/photos');

    const submit = screen.getByRole('button', { name: /add/i });
    await waitFor(() => expect(submit).toBeDisabled());

    await user.clear(input);
    await user.type(
      input,
      `https://drive.google.com/drive/folders/${MOCK_DRIVE_FOLDER_ID}`,
    );
    await waitFor(() => expect(submit).toBeEnabled());
  });

  test('pre-selects album for a folder link and video for a file link', async () => {
    const { user } = await open('Add');
    const input = await linkInput();

    await user.clear(input);
    await user.type(
      input,
      `https://drive.google.com/file/d/${MOCK_DRIVE_FILE_ID}/view`,
    );
    await waitFor(() => expect(screen.getByLabelText('Video')).toBeChecked());

    await user.clear(input);
    await user.type(
      input,
      `https://drive.google.com/drive/folders/${MOCK_DRIVE_FOLDER_ID}`,
    );
    await waitFor(() => expect(screen.getByLabelText('Album')).toBeChecked());
  });

  test('lets the type be changed by hand, e.g. a photo saved as a file', async () => {
    const { user } = await open('Update', EXISTING_DOCUMENT);

    await user.click(await screen.findByLabelText('File'));

    await waitFor(() => expect(screen.getByLabelText('File')).toBeChecked());
    expect(screen.getByLabelText('Album')).not.toBeChecked();
  });

  test('picks the event date with the shared date picker', async () => {
    await open('Update', EXISTING_DOCUMENT);

    // The calendar trigger replaces the native date input.
    expect(
      await screen.findByRole('button', { name: /calendar/i }),
    ).toBeInTheDocument();
    expect(document.querySelector('input[type="date"]')).toBeNull();
  });

  test('submits the entered values through upsertDocument', async () => {
    mockUpsertDocument.mockResolvedValue({ success: true, message: 'Saved' });

    const { user } = await open('Update', EXISTING_DOCUMENT);

    const title = await screen.findByPlaceholderText(
      'Season opener highlights',
    );
    await user.type(title, ' 2026');

    const submit = await screen.findByRole('button', { name: /update/i });
    await waitFor(() => expect(submit).toBeEnabled());
    await user.click(submit);

    await waitFor(() => {
      expect(mockUpsertDocument).toHaveBeenCalledWith(
        MOCK_DOCUMENT.document_id,
        expect.objectContaining({
          title: `${MOCK_DOCUMENT.title} 2026`,
          url: MOCK_DOCUMENT.url,
          type: DocumentType.ALBUM,
          event_date: MOCK_DOCUMENT.event_date,
        }),
      );
    });
  });

  test('reports a failed save through the toaster', async () => {
    mockUpsertDocument.mockResolvedValue({
      success: false,
      message: 'This Drive link is already in the list.',
    });

    const { user } = await open('Update', EXISTING_DOCUMENT);

    const title = await screen.findByPlaceholderText(
      'Season opener highlights',
    );
    await user.type(title, ' 2026');

    const submit = await screen.findByRole('button', { name: /update/i });
    await waitFor(() => expect(submit).toBeEnabled());
    await user.click(submit);

    await waitFor(() => {
      expect(mockToaster.update).toHaveBeenCalledWith(
        'toast-id',
        expect.objectContaining({
          type: 'error',
          title: 'This Drive link is already in the list.',
        }),
      );
    });
  });

  test('clears the form after adding so another link can follow', async () => {
    mockUpsertDocument.mockResolvedValue({ success: true, message: 'Added' });

    const { user } = await open('Add');

    const title = await screen.findByPlaceholderText(
      'Season opener highlights',
    );
    await user.type(title, 'Training photos');
    await user.type(
      await linkInput(),
      `https://drive.google.com/drive/folders/${MOCK_DRIVE_FOLDER_ID}`,
    );

    const submit = await screen.findByRole('button', { name: /add/i });
    await waitFor(() => expect(submit).toBeEnabled());
    await user.click(submit);

    await waitFor(() =>
      expect(mockUpsertDocument).toHaveBeenCalledWith(
        '',
        expect.objectContaining({ title: 'Training photos' }),
      ),
    );
    await waitFor(() => expect(title).toHaveValue(''));
    expect(
      screen.getByRole('heading', { name: 'Add Document' }),
    ).toBeInTheDocument();
  });
});
