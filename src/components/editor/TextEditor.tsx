'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from 'react';

import { Button, HStack, Text, type ButtonProps } from '@chakra-ui/react';
import type { Editor } from '@tiptap/react';
import { Check, Copy, Eye, Pencil, Save } from 'lucide-react';

import {
  EditorToolbar,
  useEditorContent,
  useRichTextEditor,
} from '@/components/editor/RichTextInput';
import {
  RichTextEditor,
  flushContentCss,
} from '@/components/ui/rich-text-editor';

import { editorToPlainText } from '@/components/editor/plain-text';
import { formatDatetime } from '@/utils/formatter';

type TextEditorProps = {
  content: string;
  onSave: (html: string) => Promise<boolean> | boolean;
  canEdit?: boolean;
  lastUpdated?: Date;
  header?: ReactNode;
};

/** Preview / edit / save lifecycle over a single editor instance. */
function useEditableContent({
  content,
  onSave,
}: Pick<TextEditorProps, 'content' | 'onSave'>) {
  const [isWriting, setIsWriting] = useState(false);
  const [isSaving, startTransition] = useTransition();

  // Dirty when the document differs from the last saved or loaded HTML.
  const savedHTML = useRef<string>(undefined);
  const [isDirty, setIsDirty] = useState(false);
  const markSaved = useCallback((editor: Editor) => {
    savedHTML.current = editor.getHTML();
    setIsDirty(false);
  }, []);

  const editor = useRichTextEditor({
    content,
    // Lock only while saving, so saving from preview shows no editing chrome.
    editable: isWriting && !isSaving,
    onCreate: ({ editor }) => markSaved(editor),
    onUpdate: ({ editor }) =>
      setIsDirty(editor.getHTML() !== savedHTML.current),
  });

  // Pick up freshly saved content, but never over a draft in progress.
  useEditorContent(editor, content, { paused: isWriting, onLoad: markSaved });

  const cancel = () => {
    if (!editor) return;
    setIsWriting(false);
    editor.commands.setContent(content, { emitUpdate: false });
    markSaved(editor);
  };

  const save = () => {
    if (!editor) return;
    startTransition(async () => {
      if (await onSave(editor.getHTML())) {
        markSaved(editor);
        setIsWriting(false);
      }
    });
  };

  return {
    editor,
    isWriting,
    isSaving,
    isDirty,
    save,
    cancel,
    toggleMode: () => setIsWriting((writing) => !writing),
  };
}

const lastUpdatedLabel = (lastUpdated: Date) =>
  `Last updated on ${formatDatetime(lastUpdated)}`;

/** Copy as HTML + plain text; fall back to plain text only. */
async function copyEditorContent(editor: Editor, lastUpdated?: Date) {
  const footer = lastUpdated && lastUpdatedLabel(lastUpdated);
  const text = [editorToPlainText(editor.state.doc), footer]
    .filter(Boolean)
    .join('\n\n');
  const html = editor.getHTML() + (footer ? `<p>${footer}</p>` : '');

  try {
    await navigator.clipboard.write([
      new ClipboardItem({
        'text/html': new Blob([html], { type: 'text/html' }),
        'text/plain': new Blob([text], { type: 'text/plain' }),
      }),
    ]);
  } catch {
    await navigator.clipboard.writeText(text);
  }
}

const COPIED_FEEDBACK_MS = 2000;

function CopyButton({
  editor,
  lastUpdated,
}: {
  editor: Editor;
  lastUpdated?: Date;
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), COPIED_FEEDBACK_MS);
    return () => clearTimeout(timer);
  }, [copied]);

  const copy = async () => {
    await copyEditorContent(editor, lastUpdated);
    setCopied(true);
  };

  return (
    <Button size="sm" variant="outline" colorPalette="pink" onClick={copy}>
      {copied ? <Check /> : <Copy />}
      {copied ? 'Copied' : 'Copy'}
    </Button>
  );
}

function SaveButton({ children, ...props }: ButtonProps) {
  return (
    <Button loadingText="Saving" {...props}>
      <Save />
      {children}
    </Button>
  );
}

export default function TextEditor({
  content,
  onSave,
  canEdit = true,
  lastUpdated,
  header,
}: TextEditorProps) {
  const { editor, isWriting, isSaving, isDirty, toggleMode, cancel, save } =
    useEditableContent({ content, onSave });

  if (!editor) return null;

  return (
    <>
      <HStack justifyContent="space-between">
        {header}
        <HStack>
          {!isWriting && isDirty && (
            <SaveButton
              size="sm"
              variant="surface"
              colorPalette="orange"
              loading={isSaving}
              onClick={save}
            >
              Save changes?
            </SaveButton>
          )}

          <CopyButton editor={editor} lastUpdated={lastUpdated} />
          {canEdit && (
            <Button size="sm" disabled={isSaving} onClick={toggleMode}>
              {isWriting ? <Eye /> : <Pencil />}
              {isWriting ? 'Preview' : 'Edit'}
            </Button>
          )}
        </HStack>
      </HStack>

      {/* One Root for both modes so `EditorContent` never remounts. */}
      <RichTextEditor.Root
        editor={editor}
        disabled={isSaving}
        borderWidth={isWriting ? 1 : 0}
        rounded="md"
        css={isWriting ? undefined : flushContentCss}
      >
        {isWriting && <EditorToolbar />}

        <RichTextEditor.Content />

        {isWriting && (
          <RichTextEditor.Footer justifyContent="flex-end" gap={2}>
            <Button
              size="xs"
              variant="outline"
              colorPalette="red"
              disabled={isSaving}
              onClick={cancel}
            >
              Cancel
            </Button>
            <SaveButton
              size="xs"
              variant="outline"
              colorPalette="green"
              loading={isSaving}
              onClick={save}
            >
              Save
            </SaveButton>
          </RichTextEditor.Footer>
        )}
      </RichTextEditor.Root>

      {!isWriting && lastUpdated && (
        <Text fontSize="sm" paddingTop={4} color="GrayText" borderTopWidth={1}>
          {lastUpdatedLabel(lastUpdated)}
        </Text>
      )}
    </>
  );
}
