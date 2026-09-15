import { useEditor, type Editor } from '@tiptap/react';

import { Field } from '@/components/ui/field';

import {
  act,
  expectNoA11yViolations,
  renderWithUI,
  screen,
  setupTestLifecycle,
} from '@/test/utilities';

import RichTextInput from './RichTextInput';

vi.mock('@tiptap/react', () => ({
  EditorContent: () => <div className="tiptap" />,
  useEditor: vi.fn(),
  // Run the selector synchronously against the mocked editor.
  useEditorState: vi.fn(({ editor, selector }) => selector({ editor })),
}));

vi.mock('@tiptap/starter-kit', () => ({
  default: { configure: vi.fn(() => ({})) },
}));

describe('RichTextInput', () => {
  const onChange = vi.fn<(html: string) => void>();

  const mockEditor = {
    isEditable: true,
    isEmpty: false,
    setEditable: vi.fn((editable: boolean) => {
      mockEditor.isEditable = editable;
    }),
    getHTML: vi.fn(() => '<p>Note</p>'),
    chain: vi.fn(() => mockEditor),
    focus: vi.fn(() => mockEditor),
    run: vi.fn(() => mockEditor),
    toggleBold: vi.fn(() => mockEditor),
    isActive: vi.fn(() => false),
    can: vi.fn(() => ({ undo: () => true, redo: () => true })),
    commands: { setContent: vi.fn() },
  };

  /** The options the component handed to `useEditor` on its latest render. */
  const editorOptions = () => vi.mocked(useEditor).mock.calls.at(-1)?.[0];

  const setup = (
    overrides: Partial<React.ComponentProps<typeof RichTextInput>> = {},
  ) =>
    renderWithUI(
      <RichTextInput value="<p>Note</p>" onChange={onChange} {...overrides} />,
    );

  beforeEach(() => {
    vi.clearAllMocks();
    mockEditor.isEditable = true;
    mockEditor.isEmpty = false;
    mockEditor.getHTML.mockReturnValue('<p>Note</p>');
    vi.mocked(useEditor).mockReturnValue(mockEditor as unknown as Editor);
  });

  setupTestLifecycle();

  test('should be accessible', async () => {
    const { container } = setup();
    await expectNoA11yViolations(container);
  });

  test('renders the toolbar with the content', () => {
    const { container } = setup();

    expect(container.querySelector('.tiptap')).toBeInTheDocument();
    expect(screen.getByLabelText('Bold')).toBeInTheDocument();
    expect(screen.getByLabelText('Redo')).toBeInTheDocument();
  });

  test('limits the inline toolbar to marks and links', () => {
    setup({ toolbar: 'inline' });

    expect(screen.getByLabelText('Bold')).toBeInTheDocument();
    expect(screen.getByLabelText('Link')).toBeInTheDocument();
    expect(screen.queryByLabelText('H1')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Bullet List')).not.toBeInTheDocument();
  });

  test('keeps a single editor instance across value changes', () => {
    const { rerender } = setup();

    rerender(<RichTextInput value="<p>Changed</p>" onChange={onChange} />);

    expect(vi.mocked(useEditor).mock.calls[0]).toHaveLength(1);
  });

  test('reports the editor HTML on every update', () => {
    setup();
    mockEditor.getHTML.mockReturnValue('<p>Typed</p>');

    act(() => editorOptions()?.onUpdate?.({ editor: mockEditor } as never));

    expect(onChange).toHaveBeenCalledWith('<p>Typed</p>');
  });

  test('reports an empty string once the document is cleared', () => {
    setup();
    mockEditor.isEmpty = true;
    mockEditor.getHTML.mockReturnValue('<p></p>');

    act(() => editorOptions()?.onUpdate?.({ editor: mockEditor } as never));

    expect(onChange).toHaveBeenCalledWith('');
  });

  test('treats an empty value and an empty document as matching', () => {
    mockEditor.isEmpty = true;
    mockEditor.getHTML.mockReturnValue('<p></p>');

    setup({ value: '' });

    expect(mockEditor.commands.setContent).not.toHaveBeenCalled();
  });

  test('loads an outside value silently when it differs from the document', () => {
    const { rerender } = setup();
    mockEditor.commands.setContent.mockClear();

    rerender(<RichTextInput value="<p>Reset</p>" onChange={onChange} />);

    expect(mockEditor.commands.setContent).toHaveBeenCalledWith(
      '<p>Reset</p>',
      {
        emitUpdate: false,
      },
    );
    expect(onChange).not.toHaveBeenCalled();
  });

  test('leaves the document alone when the value already matches', () => {
    setup();

    expect(mockEditor.commands.setContent).not.toHaveBeenCalled();
  });

  test('locks the editor while disabled', () => {
    setup({ disabled: true });

    expect(mockEditor.setEditable).toHaveBeenCalledWith(false);
  });

  describe('field association', () => {
    /** The editable element's attributes on the latest render. */
    const attributes = () =>
      editorOptions()?.editorProps?.attributes as
        Record<string, string> | undefined;

    test('carries the id and name of the surrounding field', () => {
      renderWithUI(
        <Field required invalid label="Note" errorText="Note is required.">
          <RichTextInput value="<p>Note</p>" onChange={onChange} />
        </Field>,
      );

      const label = screen.getByText('Note').closest('label');

      expect(attributes()).toMatchObject({
        id: label?.htmlFor,
        'aria-labelledby': label?.id,
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
      vi.mocked(useEditor).mockReturnValue(null as unknown as Editor);

      renderWithUI(
        <Field label="Note">
          <RichTextInput value="" onChange={onChange} />
        </Field>,
      );

      const label = screen.getByText('Note').closest('label');

      expect(document.getElementById(label!.htmlFor)).toBeInTheDocument();
    });
  });

  test('runs toolbar commands against the editor', async () => {
    const { user } = setup();

    await user.click(screen.getByLabelText('Bold'));

    expect(mockEditor.toggleBold).toHaveBeenCalled();
  });
});
