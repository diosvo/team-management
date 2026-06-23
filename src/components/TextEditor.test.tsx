import { useEditor } from '@tiptap/react';
import { axe } from 'jest-axe';
import { Mock } from 'vitest';

import { renderWithUI, screen } from '@/test/utilities';
import TextEditor from './TextEditor';

vi.mock('@tiptap/react', () => ({
  EditorContent: () => <div className="tiptap" />,
  useEditor: vi.fn(),
}));

vi.mock('@tiptap/starter-kit', () => ({
  default: { configure: vi.fn(() => ({})) },
}));

describe('TextEditor', () => {
  const onCancel = vi.fn();
  const onSave = vi.fn();

  const mockEditor = {
    getHTML: vi.fn(() => '<p>Test content</p>'),
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
      selection: {
        empty: false,
      },
    },
  };

  const defaultProps = {
    editable: true,
    content: '<p>Test content</p>',
    onCancel,
    onSave,
  };

  const setup = (overrides = {}) => {
    const props = { ...defaultProps, ...overrides };
    (useEditor as Mock).mockReturnValue(mockEditor);
    return renderWithUI(<TextEditor {...props} />);
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockEditor.isActive.mockReturnValue(false);
    mockEditor.chain.mockReturnValue(mockEditor);
    mockEditor.focus.mockReturnValue(mockEditor);
    mockEditor.run.mockReturnValue(mockEditor);
    mockEditor.can.mockReturnValue({
      undo: vi.fn(() => true),
      redo: vi.fn(() => true),
    });
    (useEditor as Mock).mockReturnValue(mockEditor);
  });

  test('should be accessible', async () => {
    const { container } = setup();
    const result = await axe(container);
    expect(result).toHaveNoViolations();
  });

  test('renders editor with content', () => {
    const { container } = setup();
    expect(container.querySelector('.tiptap')).toBeInTheDocument();
  });

  test('hides toolbar when not editable', () => {
    setup({ editable: false });
    expect(screen.queryByLabelText('Bold')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Italic')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Underline')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Link')).not.toBeInTheDocument();
  });

  test('renders last updated text when lastUpdated is provided and not editable', () => {
    setup({ editable: false, lastUpdated: new Date('2024-01-01') });
    expect(screen.getByText(/last updated on/i)).toBeInTheDocument();
  });

  test('renders all toolbar buttons when editable', () => {
    setup();
    expect(screen.getByLabelText('Bold')).toBeInTheDocument();
    expect(screen.getByLabelText('Italic')).toBeInTheDocument();
    expect(screen.getByLabelText('Underline')).toBeInTheDocument();
    expect(screen.getByLabelText('Strikethrough')).toBeInTheDocument();
    expect(screen.getByLabelText('H1')).toBeInTheDocument();
    expect(screen.getByLabelText('H2')).toBeInTheDocument();
    expect(screen.getByLabelText('H3')).toBeInTheDocument();
    expect(screen.getByLabelText('H4')).toBeInTheDocument();
    expect(screen.getByLabelText('Bullet List')).toBeInTheDocument();
    expect(screen.getByLabelText('Ordered List')).toBeInTheDocument();
    expect(screen.getByLabelText('Link')).toBeInTheDocument();
    expect(screen.getByLabelText('Unlink')).toBeInTheDocument();
    expect(screen.getByLabelText('Undo')).toBeInTheDocument();
    expect(screen.getByLabelText('Redo')).toBeInTheDocument();
  });

  test('renders cancel and save buttons in footer', () => {
    setup();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
  });

  test('calls onSave with editor HTML when save button is clicked', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('button', { name: /save/i }));
    expect(onSave).toHaveBeenCalledWith('<p>Test content</p>');
  });

  test('calls onCancel and resets content when cancel button is clicked', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalled();
    expect(mockEditor.commands.setContent).toHaveBeenCalledWith(
      '<p>Test content</p>',
    );
  });

  test('toggles bold formatting', async () => {
    const { user } = setup();
    await user.click(screen.getByLabelText('Bold'));
    expect(mockEditor.chain).toHaveBeenCalled();
    expect(mockEditor.toggleBold).toHaveBeenCalled();
  });

  test('toggles italic formatting', async () => {
    const { user } = setup();
    await user.click(screen.getByLabelText('Italic'));
    expect(mockEditor.chain).toHaveBeenCalled();
    expect(mockEditor.toggleItalic).toHaveBeenCalled();
  });

  test('toggles underline formatting', async () => {
    const { user } = setup();
    await user.click(screen.getByLabelText('Underline'));
    expect(mockEditor.chain).toHaveBeenCalled();
    expect(mockEditor.toggleUnderline).toHaveBeenCalled();
  });

  test('toggles strikethrough formatting', async () => {
    const { user } = setup();
    await user.click(screen.getByLabelText('Strikethrough'));
    expect(mockEditor.chain).toHaveBeenCalled();
    expect(mockEditor.toggleStrike).toHaveBeenCalled();
  });

  test('toggles bullet list', async () => {
    const { user } = setup();
    await user.click(screen.getByLabelText('Bullet List'));
    expect(mockEditor.chain).toHaveBeenCalled();
    expect(mockEditor.toggleBulletList).toHaveBeenCalled();
  });

  test('toggles ordered list', async () => {
    const { user } = setup();
    await user.click(screen.getByLabelText('Ordered List'));
    expect(mockEditor.chain).toHaveBeenCalled();
    expect(mockEditor.toggleOrderedList).toHaveBeenCalled();
  });
});
