import {
  asEditor,
  createMockEditor,
  editorOptions,
  useEditorMock,
  type MockEditor,
} from '@/test/mocks/tiptap';
import {
  expectNoA11yViolations,
  renderWithUI,
  setupTestLifecycle,
} from '@/test/utilities';

import RichTextViewer from './RichTextViewer';

vi.mock('@tiptap/react', async () =>
  (await import('@/test/mocks/tiptap')).tiptapReact(),
);
vi.mock('@tiptap/starter-kit', async () =>
  (await import('@/test/mocks/tiptap')).tiptapStarterKit(),
);

describe('RichTextViewer', () => {
  let editor: MockEditor;

  const setup = (content = '<p>Needs replacing</p>') =>
    renderWithUI(<RichTextViewer content={content} />);

  setupTestLifecycle();

  beforeEach(() => {
    editor = createMockEditor();
    useEditorMock.mockReturnValue(asEditor(editor));
  });

  test('should be accessible', async () => {
    const { container } = setup();
    await expectNoA11yViolations(container);
  });

  test('renders the content read-only without a toolbar', () => {
    const { container } = setup();

    expect(container.querySelector('.tiptap')).toBeInTheDocument();
    expect(container.querySelector('[aria-label="Bold"]')).toBeNull();
    expect(editorOptions()).toMatchObject({
      content: '<p>Needs replacing</p>',
      editable: false,
    });
  });

  test('loads new content into the same editor instance', () => {
    const { rerender } = setup();

    rerender(<RichTextViewer content="<p>Replaced</p>" />);

    expect(useEditorMock.mock.calls[0]).toHaveLength(1);
    expect(editor.commands.setContent).toHaveBeenCalledWith('<p>Replaced</p>', {
      emitUpdate: false,
    });
  });

  test('does not reload content that has not changed', () => {
    const { rerender } = setup();

    rerender(<RichTextViewer content="<p>Needs replacing</p>" />);

    expect(editor.commands.setContent).not.toHaveBeenCalled();
  });
});
