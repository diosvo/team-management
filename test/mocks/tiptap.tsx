import { act } from '@testing-library/react';
import type { Editor, EditorOptions } from '@tiptap/react';
import type { Mock } from 'vitest';

/**
 * Commands the toolbar controls reach through `chain().focus()…run()`. Each one
 * is chainable on the mock, so a click is observable as `editor.toggleBold`
 * having been called.
 */
const CHAIN_COMMANDS = [
  'toggleBold',
  'toggleItalic',
  'toggleUnderline',
  'toggleStrike',
  'toggleCode',
  'toggleHeading',
  'toggleBulletList',
  'toggleOrderedList',
  'toggleBlockquote',
  'setHorizontalRule',
  'extendMarkRange',
  'setLink',
  'unsetLink',
  'undo',
  'redo',
] as const;

type ChainCommands = Record<
  (typeof CHAIN_COMMANDS)[number],
  Mock<() => MockEditor>
>;

export type MockEditor = ChainCommands & {
  chain: Mock<() => MockEditor>;
  focus: Mock<() => MockEditor>;
  run: Mock<() => MockEditor>;
  isEditable: boolean;
  isEmpty: boolean;
  setEditable: Mock<(editable: boolean) => void>;
  getHTML: Mock<() => string>;
  getText: Mock<() => string>;
  isActive: Mock<() => boolean>;
  getAttributes: Mock<() => Record<string, string>>;
  can: Mock<() => { undo: () => boolean; redo: () => boolean }>;
  commands: { setContent: Mock };
  storage: { characterCount: { characters: Mock<() => number> } };
  state: { doc: unknown; selection: { empty: boolean } };
};

/**
 * @description A fake Tiptap editor covering the surface the editor components
 * touch. Build a fresh one per test so no state leaks between them.
 * @example
 * ```ts
 * beforeEach(() => {
 *   editor = createMockEditor();
 *   useEditorMock.mockReturnValue(asEditor(editor));
 * });
 * ```
 */
export function createMockEditor({ editable = false } = {}): MockEditor {
  const chainCommands = Object.fromEntries(
    CHAIN_COMMANDS.map((command) => [command, vi.fn(() => editor)]),
  ) as ChainCommands;

  const editor: MockEditor = {
    ...chainCommands,
    isEditable: editable,
    isEmpty: false,
    setEditable: vi.fn((next: boolean) => {
      editor.isEditable = next;
    }),
    getHTML: vi.fn(() => '<p>Test content</p>'),
    getText: vi.fn(() => 'Test content'),
    isActive: vi.fn(() => false),
    getAttributes: vi.fn(() => ({ href: '' })),
    can: vi.fn(() => ({ undo: () => true, redo: () => true })),
    commands: { setContent: vi.fn() },
    storage: { characterCount: { characters: vi.fn(() => 0) } },
    state: { doc: { type: { name: 'doc' } }, selection: { empty: false } },
    chain: vi.fn(() => editor),
    focus: vi.fn(() => editor),
    run: vi.fn(() => editor),
  };

  return editor;
}

/** The mock is not a whole `Editor`, so the cast lives here once. */
export const asEditor = (editor: MockEditor) => editor as unknown as Editor;

/** Stands in for `useEditor`; set its return value with `asEditor`. */
export const useEditorMock =
  vi.fn<(options?: Partial<EditorOptions>) => Editor | null>();

/**
 * @description Module factory for `@tiptap/react`. Rendering a real editor
 * needs a DOM ProseMirror can drive, so specs assert against the options the
 * component hands to `useEditor` instead.
 * @example
 * ```ts
 * vi.mock('@tiptap/react', async () =>
 *   (await import('@/test/mocks/tiptap')).tiptapReact(),
 * );
 * ```
 */
export const tiptapReact = () => ({
  EditorContent: () => <div className="tiptap" />,
  useEditor: useEditorMock,
  // Run the selector synchronously against the mocked editor.
  useEditorState: vi.fn(({ editor, selector }) => selector({ editor })),
});

/** Module factory for `@tiptap/starter-kit`; extensions are never exercised. */
export const tiptapStarterKit = () => ({
  default: { configure: vi.fn(() => ({})) },
});

/** The options the component handed to `useEditor` on its latest render. */
export const editorOptions = () => useEditorMock.mock.calls.at(-1)?.[0];

/** Fire the `update` handler the component registered with `useEditor`. */
export const emitUpdate = (editor: MockEditor) =>
  act(() => {
    editorOptions()?.onUpdate?.({ editor } as never);
  });
