import { useEditor, type Editor } from '@tiptap/react';

import {
  expectNoA11yViolations,
  renderWithUI,
  setupTestLifecycle,
} from '@/test/utilities';

import RichTextViewer from './RichTextViewer';

vi.mock('@tiptap/react', () => ({
  EditorContent: () => <div className="tiptap" />,
  useEditor: vi.fn(),
  useEditorState: vi.fn(({ editor, selector }) => selector({ editor })),
}));

vi.mock('@tiptap/starter-kit', () => ({
  default: { configure: vi.fn(() => ({})) },
}));

describe('RichTextViewer', () => {
  const mockEditor = {
    isEditable: false,
    setEditable: vi.fn(),
    commands: { setContent: vi.fn() },
  };

  const setup = (content = '<p>Needs replacing</p>') =>
    renderWithUI(<RichTextViewer content={content} />);

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useEditor).mockReturnValue(mockEditor as unknown as Editor);
  });

  setupTestLifecycle();

  test('should be accessible', async () => {
    const { container } = setup();
    await expectNoA11yViolations(container);
  });

  test('renders the content read-only without a toolbar', () => {
    const { container } = setup();

    expect(container.querySelector('.tiptap')).toBeInTheDocument();
    expect(container.querySelector('[aria-label="Bold"]')).toBeNull();
    expect(vi.mocked(useEditor).mock.calls[0][0]).toMatchObject({
      content: '<p>Needs replacing</p>',
      editable: false,
    });
  });

  test('loads new content into the same editor instance', () => {
    const { rerender } = setup();

    rerender(<RichTextViewer content="<p>Replaced</p>" />);

    expect(vi.mocked(useEditor).mock.calls[0]).toHaveLength(1);
    expect(mockEditor.commands.setContent).toHaveBeenCalledWith(
      '<p>Replaced</p>',
      { emitUpdate: false },
    );
  });

  test('does not reload content that has not changed', () => {
    const { rerender } = setup();

    rerender(<RichTextViewer content="<p>Needs replacing</p>" />);

    expect(mockEditor.commands.setContent).not.toHaveBeenCalled();
  });
});
