'use client';

import { useEffect, useMemo, useRef, type ComponentType } from 'react';

import { CharacterCount } from '@tiptap/extensions';
import {
  useEditor,
  useEditorState,
  type Editor,
  type EditorOptions,
} from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

import {
  Control,
  RichTextEditor,
  type RichTextEditorProps,
  type RichTextEditorToolbarProps,
} from '@/components/ui/rich-text-editor';
import { useRichTextEditorContext } from '@/components/ui/rich-text-editor-context';
import { Span, Text } from '@chakra-ui/react';

/** Ceiling for editors that are not given a field-specific `limit`. */
export const DEFAULT_CHARACTER_LIMIT = 100000;

const createExtensions = (limit: number) => [
  StarterKit.configure({ link: { openOnClick: false } }),
  CharacterCount.configure({ limit }),
];

type UseRichTextEditorOptions = Pick<
  Partial<EditorOptions>,
  'content' | 'editable' | 'onCreate' | 'onUpdate'
> & {
  /** Most characters the document may hold; input past it is refused. */
  limit?: number;
};

/** One editor instance per component; `editable` stays in sync. */
export function useRichTextEditor({
  editable = true,
  limit = DEFAULT_CHARACTER_LIMIT,
  ...options
}: UseRichTextEditorOptions) {
  // Extensions are fixed at creation; changing `limit` needs a new editor.
  const extensions = useMemo(() => createExtensions(limit), [limit]);
  const editor = useEditor({
    ...options,
    editable,
    extensions,
    immediatelyRender: false,
  });

  useEffect(() => {
    if (editor && editor.isEditable !== editable) editor.setEditable(editable);
  }, [editor, editable]);

  return editor;
}

type UseEditorContentOptions = Partial<{
  /** Skip loading while a draft is in progress. */
  paused: boolean;
  onLoad: (editor: Editor) => void;
}>;

/** Load `content` into the editor when it changes, without emitting `update`. */
export function useEditorContent(
  editor: Nullable<Editor>,
  content: string,
  { paused = false, onLoad }: UseEditorContentOptions = {},
) {
  const loaded = useRef(content);

  useEffect(() => {
    if (!editor || paused || loaded.current === content) return;
    loaded.current = content;
    editor.commands.setContent(content, { emitUpdate: false });
    onLoad?.(editor);
  }, [editor, content, paused, onLoad]);
}

const MARKS = [
  Control.Bold,
  Control.Italic,
  Control.Underline,
  Control.Strikethrough,
];
const LINKS = [Control.Link, Control.Unlink];

export const TOOLBARS = {
  /** Marks and links: for short fields such as a note. */
  inline: [MARKS, LINKS],
  full: [
    MARKS,
    [Control.H1, Control.H2, Control.H3, Control.H4],
    [Control.BulletList, Control.OrderedList, Control.Blockquote],
    LINKS,
    [Control.Undo, Control.Redo],
  ],
} satisfies Record<string, ComponentType[][]>;

export type ToolbarPreset = keyof typeof TOOLBARS;

type EditorToolbarProps = RichTextEditorToolbarProps &
  Partial<{
    preset: ToolbarPreset;
    limit: number;
  }>;

/** Formatting toolbar for `RichTextEditor.Root`. */
export function EditorToolbar({
  preset = 'full',
  limit = DEFAULT_CHARACTER_LIMIT,
  ...props
}: EditorToolbarProps) {
  const { editor } = useRichTextEditorContext();
  // Re-render controls on every transaction so their active state is current.
  useEditorState({
    editor,
    selector: ({ transactionNumber }) => transactionNumber,
  });

  if (!editor) return null;

  const charsCount = editor.storage.characterCount.characters();
  const isOverLimit = charsCount >= limit;

  return (
    <RichTextEditor.Toolbar {...props}>
      {TOOLBARS[preset].map((group, groupIndex) => (
        <RichTextEditor.ControlGroup key={groupIndex}>
          {group.map((ToolbarControl, index) => (
            <ToolbarControl key={index} />
          ))}
        </RichTextEditor.ControlGroup>
      ))}
      <RichTextEditor.ControlGroup alignItems="center" marginLeft="auto">
        <Text fontSize="xs">
          <Span
            color={isOverLimit ? 'red' : 'GrayText'}
            fontWeight={isOverLimit ? 'bold' : 'normal'}
          >
            {charsCount}
          </Span>
          <Span color="GrayText"> / {limit} characters</Span>
        </Text>
      </RichTextEditor.ControlGroup>
    </RichTextEditor.Toolbar>
  );
}

/** Field value: HTML, or `''` for an empty document. */
const toValue = (editor: Editor) => (editor.isEmpty ? '' : editor.getHTML());

type RichTextInputProps = Omit<RichTextEditorProps, 'editor' | 'onChange'> &
  Partial<{
    /** Document as HTML; `''` when empty. */
    value: string;
    /** e.g. the field's schema `.max()`; defaults to {@link DEFAULT_CHARACTER_LIMIT}. */
    limit: number;
    toolbar: ToolbarPreset;
    onChange: (html: string) => void;
  }>;

/** Controlled rich-text field that emits HTML. */
export default function RichTextInput({
  value = '',
  limit,
  toolbar = 'full',
  disabled,
  onChange,
  ...rootProps
}: RichTextInputProps) {
  const editor = useRichTextEditor({
    content: value,
    editable: !disabled,
    limit,
    onUpdate: ({ editor }) => onChange?.(toValue(editor)),
  });

  // Sync an external value without re-triggering `onChange`.
  useEffect(() => {
    if (editor && toValue(editor) !== value) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [editor, value]);

  if (!editor) return null;

  return (
    <RichTextEditor.Root
      editor={editor}
      disabled={disabled}
      rounded="md"
      {...rootProps}
    >
      <EditorToolbar preset={toolbar} limit={limit} />
      <RichTextEditor.Content />
    </RichTextEditor.Root>
  );
}
