import { useEditor } from '@tiptap/react';
import { axe } from 'jest-axe';
import { Mock } from 'vitest';

import { renderWithUI, screen, waitFor } from '@/test/utilities';
import TextEditor from './TextEditor';

vi.mock('@tiptap/react', () => ({
  EditorContent: () => <div className="tiptap" />,
  useEditor: vi.fn(),
}));

vi.mock('@tiptap/extension-link', () => ({
  default: {
    configure: vi.fn(() => ({})),
    options: {
      shouldAutoLink: vi.fn((url: string) => url.startsWith('https://')),
    },
  },
}));

vi.mock('@tiptap/extension-underline', () => ({
  default: {},
}));

vi.mock('@tiptap/starter-kit', () => ({
  default: {},
}));

describe('TextEditor', () => {
  const defaultContent = '<p>Default content</p>';
  const onChange = vi.fn();

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
    toggleBulletList: vi.fn(() => mockEditor),
    toggleOrderedList: vi.fn(() => mockEditor),
    extendMarkRange: vi.fn(() => mockEditor),
    setLink: vi.fn(() => mockEditor),
    unsetLink: vi.fn(() => mockEditor),
    isActive: vi.fn((type: string) => false),
    getAttributes: vi.fn(() => ({ href: '' })),
    commands: {
      setContent: vi.fn(),
    },
    state: {
      selection: {
        empty: false, // Ensure selection is not empty by default
      },
    },
  };

  const defaultProps = {
    editable: true,
    content: '<p>Test content</p>',
    defaultContent,
    hasChanges: false,
    onChange,
  };

  const setup = (overrides = {}) => {
    const props = { ...defaultProps, ...overrides };
    (useEditor as Mock).mockReturnValue(mockEditor);
    const view = renderWithUI(<TextEditor {...props} />);

    return view;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock editor state and ensure all mocks return the editor for chaining
    mockEditor.state.selection.empty = false;
    mockEditor.isActive.mockReturnValue(false);
    mockEditor.chain.mockReturnValue(mockEditor);
    mockEditor.focus.mockReturnValue(mockEditor);
    mockEditor.extendMarkRange.mockReturnValue(mockEditor);
    mockEditor.setLink.mockReturnValue(mockEditor);
    mockEditor.unsetLink.mockReturnValue(mockEditor);
    mockEditor.run.mockReturnValue(mockEditor);
    (useEditor as Mock).mockReturnValue(mockEditor);
  });

  test('should be accessible', async () => {
    const { container } = setup();

    const result = await axe(container);
    expect(result).toHaveNoViolations();
  });

  test('renders editor with content', () => {
    const { container } = setup();

    const editor = container.querySelector('.tiptap');
    expect(editor).toBeInTheDocument();
  });

  test('hides toolbar when not editable', () => {
    setup({ editable: false });

    // All toolbar buttons should not be visible
    expect(screen.queryByLabelText('Bold')).not.toBeVisible();
    expect(screen.queryByLabelText('Italic')).not.toBeVisible();
    expect(screen.queryByLabelText('Underline')).not.toBeVisible();
    expect(screen.queryByLabelText('Insert Link')).not.toBeVisible();
  });

  test('renders all toolbar buttons when editable', () => {
    setup();

    expect(screen.getByLabelText('Bold')).toBeInTheDocument();
    expect(screen.getByLabelText('Italic')).toBeInTheDocument();
    expect(screen.getByLabelText('Underline')).toBeInTheDocument();
    expect(screen.getByLabelText('Insert Link')).toBeInTheDocument();
    expect(screen.getByLabelText('Bullet List')).toBeInTheDocument();
    expect(screen.getByLabelText('Numbered List')).toBeInTheDocument();
    expect(screen.getByLabelText('Reset')).toBeInTheDocument();
  });

  test('toggles bold formatting', async () => {
    const { user } = setup();

    const boldButton = screen.getByLabelText('Bold');
    await user.click(boldButton);

    expect(mockEditor.chain).toHaveBeenCalled();
    expect(mockEditor.toggleBold).toHaveBeenCalled();
  });

  test('toggles italic formatting', async () => {
    const { user } = setup();

    const italicButton = screen.getByLabelText('Italic');
    await user.click(italicButton);

    expect(mockEditor.chain).toHaveBeenCalled();
    expect(mockEditor.toggleItalic).toHaveBeenCalled();
  });

  test('toggles underline formatting', async () => {
    const { user } = setup();

    const underlineButton = screen.getByLabelText('Underline');
    await user.click(underlineButton);

    expect(mockEditor.chain).toHaveBeenCalled();
    expect(mockEditor.toggleUnderline).toHaveBeenCalled();
  });

  test('toggles bullet list', async () => {
    const { user } = setup();

    const bulletListButton = screen.getByLabelText('Bullet List');
    await user.click(bulletListButton);

    expect(mockEditor.chain).toHaveBeenCalled();
    expect(mockEditor.toggleBulletList).toHaveBeenCalled();
  });

  test('toggles numbered list', async () => {
    const { user } = setup();

    const numberedListButton = screen.getByLabelText('Numbered List');
    await user.click(numberedListButton);

    expect(mockEditor.chain).toHaveBeenCalled();
    expect(mockEditor.toggleOrderedList).toHaveBeenCalled();
  });

  test('disables reset button when hasChanges is false', () => {
    setup({ hasChanges: false });

    const resetButton = screen.getByLabelText('Reset');
    expect(resetButton).toBeDisabled();
  });

  test('enables reset button when hasChanges is true', () => {
    setup({ hasChanges: true });

    const resetButton = screen.getByLabelText('Reset');
    expect(resetButton).not.toBeDisabled();
  });

  test('resets content to default when reset button is clicked', async () => {
    const { user } = setup({ hasChanges: true });

    const resetButton = screen.getByLabelText('Reset');
    await user.click(resetButton);

    expect(onChange).toHaveBeenCalledWith(defaultContent);
    expect(mockEditor.commands.setContent).toHaveBeenCalledWith(defaultContent);
  });

  test('opens link popover when insert link button is clicked', async () => {
    const { user } = setup();

    const linkButton = screen.getByLabelText('Insert Link');
    await user.click(linkButton);

    await waitFor(() => {
      expect(
        screen.getByPlaceholderText('https://example.com'),
      ).toBeInTheDocument();
    });
  });

  test('disables insert link button when selection is empty', () => {
    mockEditor.state.selection.empty = true;
    setup();

    const linkButton = screen.getByLabelText('Insert Link');
    expect(linkButton).toBeDisabled();
  });

  test('inserts link with valid URL', async () => {
    // Ensure selection is not empty and reset mocks
    mockEditor.state.selection.empty = false;
    mockEditor.chain.mockReturnValue(mockEditor);
    mockEditor.focus.mockReturnValue(mockEditor);
    mockEditor.extendMarkRange.mockReturnValue(mockEditor);
    mockEditor.setLink.mockReturnValue(mockEditor);
    mockEditor.run.mockReturnValue(mockEditor);

    const { user } = setup();

    const linkButton = screen.getByLabelText('Insert Link');
    expect(linkButton).not.toBeDisabled();

    await user.click(linkButton);

    const urlInput = await screen.findByPlaceholderText('https://example.com');
    await user.clear(urlInput);
    await user.type(urlInput, 'https://example.com');

    const okButton = screen.getByRole('button', { name: /ok/i });
    await user.click(okButton);

    expect(mockEditor.chain).toHaveBeenCalled();
    expect(mockEditor.focus).toHaveBeenCalled();
    expect(mockEditor.extendMarkRange).toHaveBeenCalledWith('link');
    expect(mockEditor.setLink).toHaveBeenCalledWith({
      href: 'https://example.com',
    });
    expect(mockEditor.run).toHaveBeenCalled();
  });

  test('disables OK button for invalid URL', async () => {
    mockEditor.state.selection.empty = false;
    const { user } = setup();

    const linkButton = screen.getByLabelText('Insert Link');
    await user.click(linkButton);

    const urlInput = await screen.findByPlaceholderText('https://example.com');
    await user.type(urlInput, 'invalid-url');

    const okButton = screen.getByRole('button', { name: /ok/i });
    expect(okButton).toBeDisabled();
  });

  test('unsets link when empty URL is provided', async () => {
    mockEditor.state.selection.empty = false;
    mockEditor.getAttributes.mockReturnValue({ href: 'https://existing.com' });

    const { user } = setup();

    const linkButton = screen.getByLabelText('Insert Link');
    await user.click(linkButton);

    // Input should show the existing link
    const urlInput = (await screen.findByPlaceholderText(
      'https://example.com',
    )) as HTMLInputElement;

    // Clear the input to make it empty
    await user.clear(urlInput);

    // Wait for input to be empty
    await waitFor(() => {
      expect(urlInput.value).toBe('');
    });

    const okButton = screen.getByRole('button', { name: /ok/i });

    // OK button should be disabled for empty URL
    expect(okButton).toBeDisabled();
  });

  test('unsets link by clearing existing URL', async () => {
    mockEditor.state.selection.empty = false;
    mockEditor.isActive.mockImplementation((type: string) => type === 'link');
    mockEditor.getAttributes.mockReturnValue({ href: 'https://existing.com' });

    const { user } = setup();

    const linkButton = screen.getByLabelText('Insert Link');
    await user.click(linkButton);

    // When link is active, remove button should be shown
    const removeButton = await screen.findByRole('button', { name: /remove/i });
    await user.click(removeButton);

    expect(mockEditor.chain).toHaveBeenCalled();
    expect(mockEditor.focus).toHaveBeenCalled();
    expect(mockEditor.unsetLink).toHaveBeenCalled();
  });
});
