import {
  asEditor,
  createMockEditor,
  emitUpdate,
  useEditorMock,
  type MockEditor,
} from '@/test/mocks/tiptap';
import {
  act,
  expectNoA11yViolations,
  renderWithUI,
  screen,
  setupTestLifecycle,
  waitFor,
} from '@/test/utilities';

import { editorToPlainText } from '@/components/editor/plain-text';

import TextEditor from './TextEditor';

vi.mock('@tiptap/react', async () =>
  (await import('@/test/mocks/tiptap')).tiptapReact(),
);
vi.mock('@tiptap/starter-kit', async () =>
  (await import('@/test/mocks/tiptap')).tiptapStarterKit(),
);

// The document walker has its own tests against a real schema.
vi.mock('@/components/editor/plain-text', () => ({
  editorToPlainText: vi.fn(() => 'Rules\n• Be on time.'),
}));

const PLAIN_TEXT = 'Rules\n• Be on time.';

describe('TextEditor', () => {
  const onSave = vi.fn<(content: string) => Promise<boolean>>();
  let editor: MockEditor;

  const defaultProps = { content: '<p>Test content</p>', onSave };

  const setup = (
    overrides: Partial<React.ComponentProps<typeof TextEditor>> = {},
  ) => renderWithUI(<TextEditor {...defaultProps} {...overrides} />);

  type User = ReturnType<typeof setup>['user'];

  const clickButton = (user: User, name: string | RegExp) =>
    user.click(screen.getByRole('button', { name }));

  /** Type into the editor, then step back to preview so the draft is pending. */
  const previewDraft = async (user: User) => {
    await clickButton(user, 'Edit');
    editor.getHTML.mockReturnValue('<p>Draft</p>');
    emitUpdate(editor);
    await clickButton(user, 'Preview');
  };

  const saveChangesPrompt = () =>
    screen.queryByRole('button', { name: 'Save changes?' });

  setupTestLifecycle();

  beforeEach(() => {
    editor = createMockEditor();
    useEditorMock.mockReturnValue(asEditor(editor));
  });

  test('should be accessible', async () => {
    const { container } = setup();
    await expectNoA11yViolations(container);
  });

  test('renders the header next to the actions', () => {
    setup({ header: <h1>Team Rule</h1> });
    expect(
      screen.getByRole('heading', { name: 'Team Rule' }),
    ).toBeInTheDocument();
  });

  describe('preview mode', () => {
    test('renders the content read-only without a toolbar', () => {
      const { container } = setup();

      expect(container.querySelector('.tiptap')).toBeInTheDocument();
      expect(screen.queryByLabelText('Bold')).not.toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: /save/i }),
      ).not.toBeInTheDocument();
    });

    test('offers to edit', () => {
      setup();
      expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
    });

    test('hides the edit toggle when the user cannot edit', () => {
      setup({ canEdit: false });

      expect(screen.queryByRole('button', { name: 'Edit' })).toBeNull();
      expect(screen.getByRole('button', { name: /copy/i })).toBeInTheDocument();
    });

    test('shows when the content was last updated', () => {
      setup({ lastUpdated: new Date('2024-01-01') });
      expect(screen.getByText(/last updated on/i)).toBeInTheDocument();
    });

    test('omits the last updated line without a date', () => {
      setup();
      expect(screen.queryByText(/last updated on/i)).not.toBeInTheDocument();
    });
  });

  describe('content sync', () => {
    test('keeps a single editor instance across content changes', () => {
      setup();

      // Recreating the editor on `content` destroys the instance the copy
      // button is still reading from ("Cannot read properties of null").
      expect(useEditorMock.mock.calls[0]).toHaveLength(1);
    });

    test('loads new saved content into the editor while previewing', () => {
      const { rerender } = setup();

      rerender(<TextEditor {...defaultProps} content="<p>Updated</p>" />);

      expect(editor.commands.setContent).toHaveBeenCalledWith(
        '<p>Updated</p>',
        {
          emitUpdate: false,
        },
      );
    });

    test('does not clobber a draft when content changes while writing', async () => {
      const { user, rerender } = setup();
      await clickButton(user, 'Edit');

      rerender(<TextEditor {...defaultProps} content="<p>Updated</p>" />);

      expect(editor.commands.setContent).not.toHaveBeenCalled();
    });
  });

  describe('save changes prompt', () => {
    test('is not offered on first render', () => {
      setup();
      expect(saveChangesPrompt()).not.toBeInTheDocument();
    });

    test('is offered when previewing a draft', async () => {
      const { user } = setup();

      await previewDraft(user);

      expect(saveChangesPrompt()).toBeInTheDocument();
    });

    test('is not offered while editing', async () => {
      const { user } = setup();
      await clickButton(user, 'Edit');
      editor.getHTML.mockReturnValue('<p>Draft</p>');

      emitUpdate(editor);

      expect(saveChangesPrompt()).not.toBeInTheDocument();
    });

    test('saves the draft from preview without opening the editor', async () => {
      let finish!: (saved: boolean) => void;
      onSave.mockReturnValue(new Promise((resolve) => (finish = resolve)));
      const { user } = setup();
      await previewDraft(user);

      await clickButton(user, 'Save changes?');

      expect(onSave).toHaveBeenCalledWith('<p>Draft</p>');
      expect(screen.queryByLabelText('Bold')).not.toBeInTheDocument();

      finish(true);

      await waitFor(() => expect(saveChangesPrompt()).not.toBeInTheDocument());
    });

    test('clears once the draft is saved from the editor', async () => {
      onSave.mockResolvedValue(true);
      const { user } = setup();
      await previewDraft(user);
      await clickButton(user, 'Edit');

      await clickButton(user, /^save$/i);

      await waitFor(() =>
        expect(screen.getByRole('button', { name: 'Edit' })).toBeEnabled(),
      );
      expect(saveChangesPrompt()).not.toBeInTheDocument();
    });

    test('clears when the draft is cancelled', async () => {
      const { user } = setup();
      await previewDraft(user);
      await clickButton(user, 'Edit');

      await clickButton(user, /cancel/i);

      expect(saveChangesPrompt()).not.toBeInTheDocument();
    });
  });

  describe('copy', () => {
    afterEach(() => {
      vi.unstubAllGlobals();
      vi.restoreAllMocks();
    });

    test('falls back to structured plain text where ClipboardItem is unavailable', async () => {
      const { user } = setup();

      await clickButton(user, 'Copy');

      expect(editorToPlainText).toHaveBeenCalledWith(editor.state.doc);
      await waitFor(async () =>
        expect(await navigator.clipboard.readText()).toBe(PLAIN_TEXT),
      );
    });

    test('falls back to plain text when the rich write is refused', async () => {
      vi.stubGlobal('ClipboardItem', class {});
      const { user } = setup();
      vi.spyOn(navigator.clipboard, 'write').mockRejectedValue(
        new Error('denied'),
      );
      const writeText = vi
        .spyOn(navigator.clipboard, 'writeText')
        .mockResolvedValue(undefined);

      await clickButton(user, 'Copy');

      expect(writeText).toHaveBeenCalledWith(PLAIN_TEXT);
      expect(
        await screen.findByRole('button', { name: 'Copied' }),
      ).toBeInTheDocument();
    });

    test('copies HTML alongside plain text where supported', async () => {
      class FakeClipboardItem {
        constructor(readonly items: Record<string, Blob>) {}
      }
      vi.stubGlobal('ClipboardItem', FakeClipboardItem);
      const { user } = setup();
      const write = vi
        .spyOn(navigator.clipboard, 'write')
        .mockResolvedValue(undefined);

      await clickButton(user, 'Copy');

      expect(write).toHaveBeenCalledOnce();
      const [item] = write.mock.calls[0][0] as unknown as FakeClipboardItem[];
      expect(Object.keys(item.items)).toEqual(['text/html', 'text/plain']);
      expect(item.items['text/html'].type).toBe('text/html');
      expect(editor.getHTML).toHaveBeenCalled();
    });

    test('appends the last updated line to both flavours', async () => {
      vi.stubGlobal('ClipboardItem', undefined);
      const { user } = setup({ lastUpdated: new Date('2024-01-01') });

      await clickButton(user, 'Copy');

      await waitFor(async () =>
        expect(await navigator.clipboard.readText()).toMatch(
          new RegExp(`^${PLAIN_TEXT}\n\nLast updated on `),
        ),
      );
    });

    test('confirms the copy, then offers to copy again', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      const { user } = setup();

      await clickButton(user, 'Copy');

      expect(
        await screen.findByRole('button', { name: 'Copied' }),
      ).toBeInTheDocument();

      act(() => vi.advanceTimersByTime(2000));

      expect(screen.getByRole('button', { name: 'Copy' })).toBeInTheDocument();
      vi.useRealTimers();
    });
  });

  describe('edit mode', () => {
    test('makes the editor editable and offers the toolbar', async () => {
      const { user } = setup();

      await clickButton(user, 'Edit');

      expect(editor.setEditable).toHaveBeenCalledWith(true);
      expect(screen.getByLabelText('Bold')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Preview' }),
      ).toBeInTheDocument();
    });

    test('returns to preview when the toggle is clicked again', async () => {
      const { user } = setup();

      await clickButton(user, 'Edit');
      await clickButton(user, 'Preview');

      expect(screen.queryByLabelText('Bold')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
    });

    test('cancel returns to preview and resets the editor', async () => {
      const { user } = setup();
      await clickButton(user, 'Edit');

      await clickButton(user, /cancel/i);

      expect(editor.commands.setContent).toHaveBeenCalledWith(
        '<p>Test content</p>',
        { emitUpdate: false },
      );
      expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
      expect(onSave).not.toHaveBeenCalled();
    });
  });

  describe('saving', () => {
    test('passes the editor HTML to onSave and leaves edit mode', async () => {
      onSave.mockResolvedValue(true);
      const { user } = setup();
      await clickButton(user, 'Edit');

      await clickButton(user, /save/i);

      expect(onSave).toHaveBeenCalledWith('<p>Test content</p>');
      await waitFor(() =>
        expect(
          screen.getByRole('button', { name: 'Edit' }),
        ).toBeInTheDocument(),
      );
    });

    test('stays in edit mode when onSave resolves false', async () => {
      onSave.mockResolvedValue(false);
      const { user } = setup();
      await clickButton(user, 'Edit');

      await clickButton(user, /save/i);

      await waitFor(() => expect(onSave).toHaveBeenCalled());
      expect(
        screen.getByRole('button', { name: 'Preview' }),
      ).toBeInTheDocument();
    });

    test('locks the editor, footer and toggle while the save is in flight', async () => {
      let finish!: (saved: boolean) => void;
      onSave.mockReturnValue(new Promise((resolve) => (finish = resolve)));
      const { user } = setup();
      await clickButton(user, 'Edit');
      editor.setEditable.mockClear();

      await clickButton(user, /save/i);

      await waitFor(() =>
        expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled(),
      );
      expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Preview' })).toBeDisabled();
      expect(editor.setEditable).toHaveBeenCalledWith(false);

      finish(true);

      await waitFor(() =>
        expect(screen.getByRole('button', { name: 'Edit' })).toBeEnabled(),
      );
    });
  });
});
