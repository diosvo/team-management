'use client';

import { useEffect, useState } from 'react';

import {
  Box,
  Button,
  ButtonGroup,
  HStack,
  IconButton,
  Input,
  Separator,
} from '@chakra-ui/react';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
  Bold,
  Italic,
  Link2,
  List,
  ListOrdered,
  Underline as UnderlineIcon,
} from 'lucide-react';

import {
  PopoverArrow,
  PopoverBody,
  PopoverContent,
  PopoverRoot,
  PopoverTitle,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Tooltip } from '@/components/ui/tooltip';

import Visibility from './visibility';

interface TextEditorProps {
  editable: boolean;
  content: string;
  onChange: (content: string) => void;
}

export default function TextEditor({
  editable,
  content,
  onChange,
}: TextEditorProps) {
  const [url, setUrl] = useState<string>('');

  const editor = useEditor({
    editable,
    content,
    extensions: [
      StarterKit,
      Underline,
      Link.configure({
        defaultProtocol: 'https',
        HTMLAttributes: {
          class: 'custom-link',
        },
        shouldAutoLink: (url) => url.startsWith('https://'),
      }),
    ],
    immediatelyRender: false,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  useEffect(() => {
    if (editor) editor.setEditable(editable);
  }, [editor, editable]);

  useEffect(() => {
    if (editor) editor.commands.setContent(content);
  }, [editor, content]);

  // Use Popover for link insertion
  const setLink = () => {
    if (!editor) return;

    // Empty
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    // Update link
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    setUrl('');
  };

  if (!editor) {
    return null;
  }

  return (
    <Box
      {...(editable
        ? { borderWidth: '1px', borderColor: 'gray.200', borderRadius: 'md' }
        : {})}
    >
      <Visibility isVisible={editable}>
        <ButtonGroup>
          <Tooltip content="Bold">
            <IconButton
              size="sm"
              variant="ghost"
              aria-label="Bold"
              onClick={() => editor.chain().focus().toggleBold().run()}
              backgroundColor={
                editor.isActive('bold') ? 'gray.100' : 'transparent'
              }
            >
              <Bold />
            </IconButton>
          </Tooltip>
          <Tooltip content="Italic">
            <IconButton
              size="sm"
              variant="ghost"
              aria-label="Italic"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              backgroundColor={
                editor.isActive('italic') ? 'gray.100' : 'transparent'
              }
            >
              <Italic />
            </IconButton>
          </Tooltip>
          <Tooltip content="Underline">
            <IconButton
              size="sm"
              variant="ghost"
              aria-label="Underline"
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              backgroundColor={
                editor.isActive('underline') ? 'gray.100' : 'transparent'
              }
            >
              <UnderlineIcon />
            </IconButton>
          </Tooltip>

          <Separator orientation="vertical" height="4" />

          <Tooltip content="Insert Link">
            <PopoverRoot lazyMount unmountOnExit size="xs">
              <PopoverTrigger
                asChild
                onClick={() => {
                  const currentLink = editor.getAttributes('link').href || '';
                  setUrl(currentLink);
                }}
              >
                <IconButton
                  size="sm"
                  variant="ghost"
                  aria-label="Insert Link"
                  disabled={editor.state.selection.empty}
                  data-active={editor.isActive('link')}
                >
                  <Link2 />
                </IconButton>
              </PopoverTrigger>
              <PopoverContent>
                <PopoverArrow />
                <PopoverBody>
                  <PopoverTitle fontSize="xs">Link to:</PopoverTitle>
                  <HStack mb={2}>
                    <Input
                      placeholder="https://example.com"
                      name="url-link"
                      size="xs"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          setLink();
                        }
                      }}
                    />
                  </HStack>
                  <ButtonGroup
                    size="xs"
                    gap={2}
                    display="flex"
                    justifyContent="flex-end"
                  >
                    {editor.isActive('link') && (
                      <Button
                        variant="plain"
                        color="red.500"
                        onClick={() => {
                          editor.chain().focus().unsetLink().run();
                          setUrl('');
                        }}
                      >
                        Remove
                      </Button>
                    )}
                    <Button
                      onClick={setLink}
                      disabled={!Link.options.shouldAutoLink(url)}
                    >
                      OK
                    </Button>
                  </ButtonGroup>
                </PopoverBody>
              </PopoverContent>
            </PopoverRoot>
          </Tooltip>
          <Tooltip content="Bullet List">
            <IconButton
              size="sm"
              variant="ghost"
              aria-label="Bullet List"
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              backgroundColor={
                editor.isActive('bulletList') ? 'gray.100' : 'transparent'
              }
            >
              <List />
            </IconButton>
          </Tooltip>
          <Tooltip content="Numbered List">
            <IconButton
              size="sm"
              variant="ghost"
              aria-label="Numbered List"
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              backgroundColor={
                editor.isActive('orderedList') ? 'gray.100' : 'transparent'
              }
            >
              <ListOrdered />
            </IconButton>
          </Tooltip>
        </ButtonGroup>
      </Visibility>
      <Box padding={editable ? 4 : 0} borderRadius="md">
        <EditorContent editor={editor} />
      </Box>
    </Box>
  );
}
