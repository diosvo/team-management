'use client';

import { Box, Button, Text } from '@chakra-ui/react';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Save } from 'lucide-react';

import { Control, RichTextEditor } from '@/components/ui/rich-text-editor';
import { formatDatetime } from '@/utils/formatter';

type TextEditorProps = {
  editable: boolean;
  content: string;
  onCancel: () => void;
  onSave: (content: string) => void;
  lastUpdated?: Date;
};

export default function TextEditor({
  editable,
  content,
  lastUpdated,
  onCancel,
  onSave,
}: TextEditorProps) {
  const editor = useEditor(
    {
      editable,
      content,
      extensions: [StarterKit.configure({ link: { openOnClick: false } })],
      shouldRerenderOnTransaction: true,
      immediatelyRender: false,
    },
    [editable, content],
  );

  if (!editor) return null;

  if (!editable) {
    return (
      <>
        <Box dangerouslySetInnerHTML={{ __html: editor.getHTML() }} />
        {lastUpdated && (
          <Text
            fontSize="sm"
            paddingTop={4}
            color="GrayText"
            borderTopWidth={1}
          >
            Last updated on {formatDatetime(lastUpdated)}
          </Text>
        )}
      </>
    );
  }

  return (
    <RichTextEditor.Root editor={editor} borderWidth="1px" rounded="md">
      <RichTextEditor.Toolbar>
        <RichTextEditor.ControlGroup>
          <Control.Bold />
          <Control.Italic />
          <Control.Underline />
          <Control.Strikethrough />
        </RichTextEditor.ControlGroup>

        <RichTextEditor.ControlGroup>
          <Control.H1 />
          <Control.H2 />
          <Control.H3 />
          <Control.H4 />
        </RichTextEditor.ControlGroup>

        <RichTextEditor.ControlGroup>
          <Control.BulletList />
          <Control.OrderedList />
        </RichTextEditor.ControlGroup>

        <RichTextEditor.ControlGroup>
          <Control.Link />
          <Control.Unlink />
        </RichTextEditor.ControlGroup>

        <RichTextEditor.ControlGroup>
          <Control.Undo />
          <Control.Redo />
        </RichTextEditor.ControlGroup>
      </RichTextEditor.Toolbar>

      <RichTextEditor.Content />

      <RichTextEditor.Footer justifyContent="flex-end">
        <Box>
          <Button
            size="xs"
            marginRight={2}
            variant="ghost"
            colorPalette="red"
            onClick={() => {
              onCancel();
              editor.commands.setContent(content);
            }}
          >
            Cancel
          </Button>
          <Button
            size="xs"
            variant="surface"
            colorPalette="green"
            onClick={() => onSave(editor.getHTML())}
          >
            <Save />
            Save
          </Button>
        </Box>
      </RichTextEditor.Footer>
    </RichTextEditor.Root>
  );
}
