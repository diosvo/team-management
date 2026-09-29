'use client';

import {
  useEditorContent,
  useRichTextEditor,
} from '@/components/editor/RichTextInput';
import {
  flushContentCss,
  RichTextEditor,
  type RichTextEditorProps,
} from '@/components/ui/rich-text-editor';

type RichTextViewerProps = Omit<RichTextEditorProps, 'editor'> & {
  /** Document as HTML. */
  content: string;
};

/** Read-only, borderless rendering of editor HTML. */
export default function RichTextViewer({
  content,
  ...rootProps
}: RichTextViewerProps) {
  const editor = useRichTextEditor({ content, editable: false });
  useEditorContent(editor, content);

  if (!editor) return null;

  return (
    <RichTextEditor.Root
      editor={editor}
      borderWidth={0}
      css={flushContentCss}
      {...rootProps}
    >
      <RichTextEditor.Content />
    </RichTextEditor.Root>
  );
}
