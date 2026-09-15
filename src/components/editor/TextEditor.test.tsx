import { useEditor, type Editor } from '@tiptap/react';

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

vi.mock('@tiptap/react', () => ({
  EditorContent: () => <div className="tiptap" />,
  useEditor: vi.fn(),
  // Run the selector synchronously against the mocked editor.
  useEditorState: vi.fn(({ editor, selector }) => selector({ editor })),
}));

vi.mock('@tiptap/starter-kit', () => ({
  default: { configure: vi.fn(() => ({})) },
}));

// The document walker has its own tests against a real schema.
vi.mock('@/components/editor/plain-text', () => ({
  editorToPlainText: vi.fn(() => 'Rules\n• Be on time.'),
}));

describe('TextEditor', () => {
  const onSave = vi.fn<(content: string) => Promise<boolean>>();

  const mockEditor = {
    isEditable: false,
    setEditable: vi.fn((editable: boolean) => {
      mockEditor.isEditable = editable;
    }),
    getHTML: vi.fn(() => '<p>Test content</p>'),
    getText: vi.fn(() => 'Rules\nBe on time.'),
    chain: vi.fn(function () {
      return mockEditor;
    }),
    focus: vi.fn(function () {
      return mockEditor;
    }),
    run: vi.fn(function () {
      return mockEditor;
    }),
    toggleBold: vi.fn(() => mockEditor),
    toggleItalic: vi.fn(() => mockEditor),
    toggleUnderline: vi.fn(() => mockEditor),
    toggleStrike: vi.fn(() => mockEditor),
    toggleBulletList: vi.fn(() => mockEditor),
    toggleOrderedList: vi.fn(() => mockEditor),
    extendMarkRange: vi.fn(() => mockEditor),
    setLink: vi.fn(() => mockEditor),
    unsetLink: vi.fn(() => mockEditor),
    undo: vi.fn(() => mockEditor),
    redo: vi.fn(() => mockEditor),
    isActive: vi.fn(() => false),
    getAttributes: vi.fn(() => ({ href: '' })),
    can: vi.fn(() => ({ undo: vi.fn(() => true), redo: vi.fn(() => true) })),
    commands: {
      setContent: vi.fn(),
    },
    state: {
      doc: { type: { name: 'doc' } },
      selection: {
        empty: false,
      },
    },
  };

  const defaultProps = {
    content: '<p>Test content</p>',
    onSave,
  };

  const setup = (
    overrides: Partial<React.ComponentProps<typeof TextEditor>> = {},
  ) => renderWithUI(<TextEditor {...defaultProps} {...overrides} />);

  const enterEditMode = (user: ReturnType<typeof setup>['user']) =>
    user.click(screen.getByRole('button', { name: 'Edit' }));

  beforeEach(() => {
    vi.clearAllMocks();
    mockEditor.isEditable = false;
    mockEditor.getHTML.mockReturnValue('<p>Test content</p>');
    mockEditor.isActive.mockReturnValue(false);
    mockEditor.chain.mockReturnValue(mockEditor);
    mockEditor.focus.mockReturnValue(mockEditor);
    mockEditor.run.mockReturnValue(mockEditor);
    mockEditor.can.mockReturnValue({
      undo: vi.fn(() => true),
      redo: vi.fn(() => true),
    });
    // `mockEditor` implements only the surface the component touches, not the
    // whole tiptap `Editor` class, so the assertion lives here once.
    vi.mocked(useEditor).mockReturnValue(mockEditor as unknown as Editor);
  });

  setupTestLifecycle();

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
      expect(vi.mocked(useEditor).mock.calls[0]).toHaveLength(1);
    });

    test('loads new saved content into the editor while previewing', () => {
      const { rerender } = setup();
      mockEditor.commands.setContent.mockClear();

      rerender(<TextEditor {...defaultProps} content="<p>Updated</p>" />);

      expect(mockEditor.commands.setContent).toHaveBeenCalledWith(
        '<p>Updated</p>',
      );
    });

    test('does not clobber a draft when content changes while writing', async () => {
      const { user, rerender } = setup();
      await enterEditMode(user);
      mockEditor.commands.setContent.mockClear();

      rerender(<TextEditor {...defaultProps} content="<p>Updated</p>" />);

      expect(mockEditor.commands.setContent).not.toHaveBeenCalled();
    });
  });

  describe('save changes prompt', () => {
    const saveChanges = () =>
      screen.queryByRole('button', { name: 'Save changes?' });

    /** Fire the `update` handler the component registered with useEditor. */
    const emitUpdate = () =>
      act(() => {
        vi.mocked(useEditor)
          .mock.calls.at(-1)?.[0]
          ?.onUpdate?.({
            editor: mockEditor,
          } as never);
      });

    const previewDraft = async (user: ReturnType<typeof setup>['user']) => {
      await enterEditMode(user);
      mockEditor.getHTML.mockReturnValue('<p>Draft</p>');
      emitUpdate();
      await user.click(screen.getByRole('button', { name: 'Preview' }));
    };

    test('is not offered on first render', () => {
      setup();
      expect(saveChanges()).not.toBeInTheDocument();
    });

    test('is offered when previewing a draft', async () => {
      const { user } = setup();

      await previewDraft(user);

      expect(saveChanges()).toBeInTheDocument();
    });

    test('is not offered while editing', async () => {
      const { user } = setup();
      await enterEditMode(user);
      mockEditor.getHTML.mockReturnValue('<p>Draft</p>');
      emitUpdate();

      expect(saveChanges()).not.toBeInTheDocument();
    });

    test('saves the draft from preview without opening the editor', async () => {
      let finish!: (saved: boolean) => void;
      onSave.mockReturnValue(new Promise((resolve) => (finish = resolve)));
      const { user } = setup();
      await previewDraft(user);

      await user.click(screen.getByRole('button', { name: 'Save changes?' }));

      expect(onSave).toHaveBeenCalledWith('<p>Draft</p>');
      expect(screen.queryByLabelText('Bold')).not.toBeInTheDocument();

      finish(true);

      await waitFor(() => expect(saveChanges()).not.toBeInTheDocument());
    });

    test('clears once the draft is saved from the editor', async () => {
      onSave.mockResolvedValue(true);
      const { user } = setup();
      await previewDraft(user);
      await user.click(screen.getByRole('button', { name: 'Edit' }));

      await user.click(screen.getByRole('button', { name: /^save$/i }));

      await waitFor(() =>
        expect(screen.getByRole('button', { name: 'Edit' })).toBeEnabled(),
      );
      expect(saveChanges()).not.toBeInTheDocument();
    });

    test('clears when the draft is cancelled', async () => {
      const { user } = setup();
      await previewDraft(user);
      await user.click(screen.getByRole('button', { name: 'Edit' }));

      await user.click(screen.getByRole('button', { name: /cancel/i }));

      expect(saveChanges()).not.toBeInTheDocument();
    });
  });

  describe('copy', () => {
    afterEach(() => vi.unstubAllGlobals());

    test('falls back to structured plain text where ClipboardItem is unavailable', async () => {
      const { user } = setup();

      await user.click(screen.getByRole('button', { name: 'Copy' }));

      expect(editorToPlainText).toHaveBeenCalledWith(mockEditor.state.doc);
      await waitFor(async () =>
        expect(await navigator.clipboard.readText()).toBe(
          'Rules\n• Be on time.',
        ),
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

      await user.click(screen.getByRole('button', { name: 'Copy' }));

      expect(writeText).toHaveBeenCalledWith('Rules\n• Be on time.');
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

      await user.click(screen.getByRole('button', { name: 'Copy' }));

      expect(write).toHaveBeenCalledOnce();
      const [item] = write.mock.calls[0][0] as unknown as FakeClipboardItem[];
      expect(Object.keys(item.items)).toEqual(['text/html', 'text/plain']);
      expect(item.items['text/html'].type).toBe('text/html');
      expect(mockEditor.getHTML).toHaveBeenCalled();
    });

    test('confirms the copy, then offers to copy again', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      const { user } = setup();

      await user.click(screen.getByRole('button', { name: 'Copy' }));

      expect(
        await screen.findByRole('button', { name: 'Copied' }),
      ).toBeInTheDocument();

      act(() => vi.advanceTimersByTime(2000));

      expect(screen.getByRole('button', { name: 'Copy' })).toBeInTheDocument();
      vi.useRealTimers();
    });
  });

  describe('edit mode', () => {
    test('makes the editor editable and offers to preview', async () => {
      const { user } = setup();

      await enterEditMode(user);

      expect(mockEditor.setEditable).toHaveBeenCalledWith(true);
      expect(
        screen.getByRole('button', { name: 'Preview' }),
      ).toBeInTheDocument();
    });

    test('returns to preview when the toggle is clicked again', async () => {
      const { user } = setup();

      await enterEditMode(user);
      await user.click(screen.getByRole('button', { name: 'Preview' }));

      expect(screen.queryByLabelText('Bold')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
    });

    test('renders all toolbar buttons', async () => {
      const { user } = setup();
      await enterEditMode(user);

      for (const label of [
        'Bold',
        'Italic',
        'Underline',
        'Strikethrough',
        'H1',
        'H2',
        'H3',
        'H4',
        'Bullet List',
        'Ordered List',
        'Link',
        'Unlink',
        'Undo',
        'Redo',
      ]) {
        expect(screen.getByLabelText(label)).toBeInTheDocument();
      }
    });

    test.each([
      ['Bold', 'toggleBold'],
      ['Italic', 'toggleItalic'],
      ['Underline', 'toggleUnderline'],
      ['Strikethrough', 'toggleStrike'],
      ['Bullet List', 'toggleBulletList'],
      ['Ordered List', 'toggleOrderedList'],
    ] as const)('%s runs %s', async (label, command) => {
      const { user } = setup();
      await enterEditMode(user);

      await user.click(screen.getByLabelText(label));

      expect(mockEditor.chain).toHaveBeenCalled();
      expect(mockEditor[command]).toHaveBeenCalled();
    });

    test('cancel returns to preview and resets the editor', async () => {
      const { user } = setup();
      await enterEditMode(user);

      await user.click(screen.getByRole('button', { name: /cancel/i }));

      expect(mockEditor.commands.setContent).toHaveBeenCalledWith(
        '<p>Test content</p>',
      );
      expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
      expect(onSave).not.toHaveBeenCalled();
    });
  });

  describe('saving', () => {
    const save = (user: ReturnType<typeof setup>['user']) =>
      user.click(screen.getByRole('button', { name: /save/i }));

    test('passes the editor HTML to onSave', async () => {
      onSave.mockResolvedValue(true);
      const { user } = setup();
      await enterEditMode(user);

      await save(user);

      expect(onSave).toHaveBeenCalledWith('<p>Test content</p>');
    });

    test('leaves edit mode when onSave resolves true', async () => {
      onSave.mockResolvedValue(true);
      const { user } = setup();
      await enterEditMode(user);

      await save(user);

      await waitFor(() =>
        expect(
          screen.getByRole('button', { name: 'Edit' }),
        ).toBeInTheDocument(),
      );
    });

    test('stays in edit mode when onSave resolves false', async () => {
      onSave.mockResolvedValue(false);
      const { user } = setup();
      await enterEditMode(user);

      await save(user);

      await waitFor(() => expect(onSave).toHaveBeenCalled());
      expect(
        screen.getByRole('button', { name: 'Preview' }),
      ).toBeInTheDocument();
    });

    test('locks the editor, footer and toggle while the save is in flight', async () => {
      let finish!: (saved: boolean) => void;
      onSave.mockReturnValue(new Promise((resolve) => (finish = resolve)));
      const { user } = setup();
      await enterEditMode(user);
      mockEditor.setEditable.mockClear();

      await save(user);

      await waitFor(() =>
        expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled(),
      );
      expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Preview' })).toBeDisabled();
      expect(mockEditor.setEditable).toHaveBeenCalledWith(false);

      finish(true);

      await waitFor(() =>
        expect(screen.getByRole('button', { name: 'Edit' })).toBeEnabled(),
      );
    });
  });
});
