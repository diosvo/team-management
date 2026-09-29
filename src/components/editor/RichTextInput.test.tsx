import { Field } from '@/components/ui/field';

import {
  asEditor,
  createMockEditor,
  editorOptions,
  emitUpdate,
  useEditorMock,
  type MockEditor,
} from '@/test/mocks/tiptap';
import {
  expectNoA11yViolations,
  renderWithUI,
  screen,
  setupTestLifecycle,
} from '@/test/utilities';

import RichTextInput, { DEFAULT_CHARACTER_LIMIT } from './RichTextInput';

vi.mock('@tiptap/react', async () =>
  (await import('@/test/mocks/tiptap')).tiptapReact(),
);
vi.mock('@tiptap/starter-kit', async () =>
  (await import('@/test/mocks/tiptap')).tiptapStarterKit(),
);

/** Every control of the `full` preset, in the order the toolbar lays them out. */
const FULL_CONTROLS = [
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
  'Blockquote',
  'Link',
  'Unlink',
  'Undo',
  'Redo',
];
const INLINE_CONTROLS = [
  'Bold',
  'Italic',
  'Underline',
  'Strikethrough',
  'Link',
  'Unlink',
];

describe('RichTextInput', () => {
  const onChange = vi.fn<(html: string) => void>();
  let editor: MockEditor;

  const setup = (
    overrides: Partial<React.ComponentProps<typeof RichTextInput>> = {},
  ) =>
    renderWithUI(
      <RichTextInput value="<p>Note</p>" onChange={onChange} {...overrides} />,
    );

  setupTestLifecycle();

  beforeEach(() => {
    editor = createMockEditor({ editable: true });
    editor.getHTML.mockReturnValue('<p>Note</p>');
    editor.storage.characterCount.characters.mockReturnValue(5);
    useEditorMock.mockReturnValue(asEditor(editor));
  });

  test('should be accessible', async () => {
    const { container } = setup();
    await expectNoA11yViolations(container);
  });

  test('renders the content', () => {
    const { container } = setup();

    expect(container.querySelector('.tiptap')).toBeInTheDocument();
  });

  test('keeps a single editor instance across value changes', () => {
    const { rerender } = setup();

    rerender(<RichTextInput value="<p>Changed</p>" onChange={onChange} />);

    // A `deps` argument would let tiptap tear the instance down and recreate it.
    expect(useEditorMock.mock.calls[0]).toHaveLength(1);
  });

  describe('toolbar', () => {
    afterEach(() => vi.restoreAllMocks());

    test.each([
      ['full', FULL_CONTROLS],
      ['inline', INLINE_CONTROLS],
    ] as const)(
      'the %s preset renders exactly its controls',
      (toolbar, labels) => {
        setup({ toolbar });

        expect(
          screen.getAllByRole('button').map((control) => control.ariaLabel),
        ).toEqual(labels);
      },
    );

    test.each([
      ['Bold', 'toggleBold'],
      ['Italic', 'toggleItalic'],
      ['Underline', 'toggleUnderline'],
      ['Strikethrough', 'toggleStrike'],
      ['Bullet List', 'toggleBulletList'],
      ['Ordered List', 'toggleOrderedList'],
      ['Blockquote', 'toggleBlockquote'],
      ['Unlink', 'unsetLink'],
      ['Undo', 'undo'],
      ['Redo', 'redo'],
    ] as const)('%s runs %s on the editor', async (label, command) => {
      const { user } = setup();

      await user.click(screen.getByLabelText(label));

      expect(editor.chain).toHaveBeenCalled();
      expect(editor[command]).toHaveBeenCalled();
    });

    test.each([
      ['H1', 1],
      ['H2', 2],
      ['H3', 3],
      ['H4', 4],
    ] as const)('%s toggles a level %i heading', async (label, level) => {
      const { user } = setup();

      await user.click(screen.getByLabelText(label));

      expect(editor.toggleHeading).toHaveBeenCalledWith({ level });
    });

    test('Link applies the URL the user is prompted for', async () => {
      vi.spyOn(window, 'prompt').mockReturnValue('https://example.com');
      const { user } = setup();

      await user.click(screen.getByLabelText('Link'));

      expect(editor.extendMarkRange).toHaveBeenCalledWith('link');
      expect(editor.setLink).toHaveBeenCalledWith({
        href: 'https://example.com',
      });
    });

    test('Link leaves the document alone when the prompt is dismissed', async () => {
      vi.spyOn(window, 'prompt').mockReturnValue(null);
      const { user } = setup();

      await user.click(screen.getByLabelText('Link'));

      expect(editor.setLink).not.toHaveBeenCalled();
    });
  });

  describe('character limit', () => {
    /** The `limit` the character-count extension was configured with. */
    const configuredLimit = () =>
      editorOptions()
        ?.extensions?.map((extension) => extension.options?.limit)
        .find((limit) => limit !== undefined);

    test('counts against the given limit', () => {
      setup({ limit: 128 });

      expect(screen.getByText('/ 128 characters')).toBeInTheDocument();
      expect(configuredLimit()).toBe(128);
    });

    test('falls back to the default limit', () => {
      setup();

      expect(
        screen.getByText(`/ ${DEFAULT_CHARACTER_LIMIT} characters`),
      ).toBeInTheDocument();
      expect(configuredLimit()).toBe(DEFAULT_CHARACTER_LIMIT);
    });

    test('flags the count once it reaches the limit', () => {
      editor.storage.characterCount.characters.mockReturnValue(128);

      setup({ limit: 128 });

      expect(screen.getByText('128')).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    test('leaves the count unflagged below the limit', () => {
      setup({ limit: 128 });

      expect(screen.getByText('5')).not.toHaveStyle({
        color: 'rgb(255, 0, 0)',
      });
    });
  });

  describe('value', () => {
    test('reports the editor HTML on every update', () => {
      setup();
      editor.getHTML.mockReturnValue('<p>Typed</p>');

      emitUpdate(editor);

      expect(onChange).toHaveBeenCalledWith('<p>Typed</p>');
    });

    test('reports an empty string once the document is cleared', () => {
      setup();
      editor.isEmpty = true;

      emitUpdate(editor);

      expect(onChange).toHaveBeenCalledWith('');
    });

    test('loads an outside value silently when it differs from the document', () => {
      const { rerender } = setup();

      rerender(<RichTextInput value="<p>Reset</p>" onChange={onChange} />);

      expect(editor.commands.setContent).toHaveBeenCalledWith('<p>Reset</p>', {
        emitUpdate: false,
      });
      expect(onChange).not.toHaveBeenCalled();
    });

    test('leaves the document alone when the value already matches', () => {
      setup();

      expect(editor.commands.setContent).not.toHaveBeenCalled();
    });

    test('treats an empty value and an empty document as matching', () => {
      editor.isEmpty = true;

      setup({ value: '' });

      expect(editor.commands.setContent).not.toHaveBeenCalled();
    });
  });

  test('locks the editor while disabled', () => {
    setup({ disabled: true });

    expect(editor.setEditable).toHaveBeenCalledWith(false);
  });

  describe('field association', () => {
    /** The editable element's attributes on the latest render. */
    const attributes = () =>
      editorOptions()?.editorProps?.attributes as
        Record<string, string> | undefined;

    const labelOf = (text: string) => screen.getByText(text).closest('label');

    test('carries the id and state of the surrounding field', () => {
      renderWithUI(
        <Field
          required
          invalid
          label="Note"
          helperText="Keep it short."
          errorText="Note is required."
        >
          <RichTextInput value="<p>Note</p>" onChange={onChange} />
        </Field>,
      );

      const label = labelOf('Note');

      expect(attributes()).toMatchObject({
        id: label?.htmlFor,
        'aria-labelledby': label?.id,
        'aria-describedby': [
          screen.getByText('Note is required.').id,
          screen.getByText('Keep it short.').id,
        ].join(' '),
        role: 'textbox',
        'aria-multiline': 'true',
        'aria-invalid': 'true',
        'aria-required': 'true',
      });
    });

    test('leaves the element unlabelled outside a field', () => {
      setup();

      expect(attributes()).toBeUndefined();
    });

    test('holds the id in the placeholder until the editor exists', () => {
      useEditorMock.mockReturnValue(null);

      renderWithUI(
        <Field label="Note">
          <RichTextInput value="" onChange={onChange} />
        </Field>,
      );

      expect(
        document.getElementById(labelOf('Note')!.htmlFor),
      ).toBeInTheDocument();
    });
  });
});
