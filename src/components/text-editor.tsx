'use client';

import { JSX, useEffect, useState } from 'react';

import {
  Box,
  Button,
  ButtonGroup,
  HStack,
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

interface TextEditorProps {
  editable: boolean;
  content: string;
  onCancel: () => void;
  onSave: (content: string) => void;
}

const useEditorSetup = (editable: boolean, content: string) => {
  const [url, setUrl] = useState('');
  const [initialContent] = useState(content);

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
  });

  useEffect(() => {
    if (editor) {
      editor.setEditable(editable);
    }
  }, [editor, editable]);

  const handleCancel = () => {
    // Reset content to initial state
    if (editor) {
      editor.commands.setContent(initialContent);
    }
  };

  const setLink = () => {
    if (!editor) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    setUrl('');
  };

  return { editor, url, setUrl, handleCancel, setLink };
};

const TextEditor = ({
  editable,
  content,
  onCancel,
  onSave,
}: TextEditorProps) => {
  const { editor, url, setUrl, handleCancel, setLink } = useEditorSetup(
    editable,
    content
  );

  if (!editor) {
    return null;
  }

  const IButton = (
    label: string,
    icon: JSX.Element,
    isActive: boolean,
    onClick: () => void,
    isDisabled?: boolean
  ) => (
    <Tooltip content={label}>
      <IconButton
        size="xs"
        variant="ghost"
        aria-label={label}
        onClick={onClick}
        data-active={isActive}
        disabled={isDisabled}
      >
        {icon}
      </IconButton>
    </Tooltip>
  );

  return (
    <>
      <Box
        {...(editable
          ? { border: '1px solid', borderColor: 'gray.200', borderRadius: 'md' }
          : {})}
      >
        <VStack align="stretch">
          {editable && (
            <ButtonGroup>
              {IButton('Bold', <Bold />, editor.isActive('bold'), () =>
                editor.chain().focus().toggleBold().run()
              )}
              {IButton('Italic', <Italic />, editor.isActive('italic'), () =>
                editor.chain().focus().toggleItalic().run()
              )}
              {IButton(
                'Underline',
                <UnderlineIcon />,
                editor.isActive('underline'),
                () => editor.chain().focus().toggleUnderline().run()
              )}
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
                    {IButton(
                      'Insert Link',
                      <Link2 />,
                      editor.isActive('link'),
                      () => editor.chain().focus().toggleUnderline().run(),
                      editor.state.selection.empty
                    )}
                  </PopoverTrigger>
                  <PopoverContent>
                    <PopoverArrow />
                    <PopoverBody>
                      <PopoverTitle fontSize="xs">Link to:</PopoverTitle>
                      <HStack mb={2}>
                        <Input
                          placeholder="https://example.com"
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
              {IButton(
                'Bullet List',
                <List />,
                editor.isActive('bulletList'),
                () => editor.chain().focus().toggleBulletList().run()
              )}
              {IButton(
                'Numbered List',
                <ListOrdered />,
                editor.isActive('orderedList'),
                () => editor.chain().focus().toggleOrderedList().run()
              )}
            </ButtonGroup>
          )}
          <Box p={2} borderRadius="md" minH="150px">
            <EditorContent editor={editor} />
          </Box>
        </VStack>
      </Box>

      {editable && (
        <HStack mt={2} gap={2}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              handleCancel();
              onCancel();
            }}
          >
            Cancel
          </Button>
          <Button size="sm" onClick={() => onSave(editor.getHTML())}>
            Save
          </Button>
        </HStack>
      )}
    </>
  );
};

export default TextEditor;
