'use client';

import { useEffect, useState } from 'react';

import {
  Box,
  Button,
  ButtonGroup,
  HStack,
  Icon,
  IconButton,
  Input,
  Separator,
  VStack,
} from '@chakra-ui/react';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
  Bold,
  Eraser,
  Italic,
  Link2,
  List,
  ListOrdered,
  Save,
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
  loading: boolean;
  content: string;
  onSave: (content: string) => void;
}

export default function TextEditor({
  editable,
  loading,
  content,
  onSave,
}: TextEditorProps) {
  const [url, setUrl] = useState<string>('');
  const [hasChanges, setHasChanges] = useState<boolean>(false);

  const editor = useEditor(
    {
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
      onUpdate: ({ editor }) => {
        const currentContent = editor.getHTML();
        setHasChanges(currentContent !== content);
      },
    },
    [content]
  );

  useEffect(() => {
    if (editor) {
      editor.setEditable(editable);
    }
  }, [editor, editable]);

  const handleReset = () => {
    if (editor) {
      editor.commands.setContent(content);
      setHasChanges(false);
    }
  };

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
    <>
      <Box
        {...(editable
          ? { border: '1px solid', borderColor: 'gray.200', borderRadius: 'md' }
          : {})}
      >
        <VStack align="stretch">
          {/* Text formatting buttons */}
          <Visibility isVisible={editable}>
            <ButtonGroup>
              <Tooltip content="Bold">
                <IconButton
                  size="xs"
                  variant="ghost"
                  aria-label="Bold"
                  onClick={() => editor.chain().focus().toggleBold().run()}
                  data-active={editor.isActive('bold')}
                >
                  <Bold />
                </IconButton>
              </Tooltip>
              <Tooltip content="Italic">
                <IconButton
                  size="xs"
                  variant="ghost"
                  aria-label="Italic"
                  onClick={() => editor.chain().focus().toggleItalic().run()}
                  data-active={editor.isActive('italic')}
                >
                  <Italic />
                </IconButton>
              </Tooltip>
              <Tooltip content="Underline">
                <IconButton
                  size="xs"
                  variant="ghost"
                  aria-label="Underline"
                  onClick={() => editor.chain().focus().toggleUnderline().run()}
                  data-active={editor.isActive('underline')}
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
                      const currentLink =
                        editor.getAttributes('link').href || '';
                      setUrl(currentLink);
                    }}
                  >
                    <IconButton
                      size="xs"
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
                  size="xs"
                  variant="ghost"
                  aria-label="Bullet List"
                  onClick={() =>
                    editor.chain().focus().toggleBulletList().run()
                  }
                  data-active={editor.isActive('bulletList')}
                >
                  <List />
                </IconButton>
              </Tooltip>
              <Tooltip content="Numbered List">
                <IconButton
                  size="xs"
                  variant="ghost"
                  aria-label="Numbered List"
                  onClick={() =>
                    editor.chain().focus().toggleOrderedList().run()
                  }
                  data-active={editor.isActive('orderedList')}
                >
                  <ListOrdered />
                </IconButton>
              </Tooltip>
            </ButtonGroup>
          </Visibility>

          <Box p={editable ? 2 : 0} borderRadius="md">
            <EditorContent editor={editor} />
          </Box>
        </VStack>
      </Box>

      <Visibility isVisible={editable}>
        <HStack justifyContent="space-between" mt={4}>
          <Button
            size="sm"
            variant="outline"
            disabled={loading}
            onClick={handleReset}
          >
            <Icon as={Eraser} color="red.400" />
            Reset
          </Button>
          <Button
            size="sm"
            disabled={loading || !hasChanges}
            onClick={() => onSave(editor.getHTML())}
          >
            <Save />
            Save
          </Button>
        </HStack>
      </Visibility>
    </>
  );
}
