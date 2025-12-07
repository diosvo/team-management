'use client';

import { useEffect, useState, useTransition } from 'react';

import { Button, HStack, Separator, Text, VStack } from '@chakra-ui/react';
import { Eye, Pencil, Save } from 'lucide-react';

import PageTitle from '@/components/PageTitle';
import TextEditor from '@/components/text-editor';
import { toaster } from '@/components/ui/toaster';
import { Tooltip } from '@/components/ui/tooltip';
import Visibility from '@/components/visibility';

import { NullishRule } from '@/drizzle/schema/rule';
import { usePermissions } from '@/hooks/use-permissions';
import { formatDatetime } from '@/utils/formatter';

import { upsertRule } from '@/actions/rule';

export default function RuleEditor({ rule }: { rule: NullishRule }) {
  const { isAdmin } = usePermissions();

  const defaultContent =
    rule?.content || 'Please wait for admin to set up the rule.';
  const [content, setContent] = useState<string>(defaultContent);

  const [isPending, startTransition] = useTransition();
  const [hasChanges, setHasChanges] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  useEffect(() => {
    setHasChanges(content !== defaultContent);
  }, [content, defaultContent]);

  const onSubmit = () => {
    startTransition(async () => {
      const id = toaster.create({
        type: 'loading',
        title: 'Updating rules...',
      });

      const { success, message: title } = await upsertRule(content);

      toaster.update(id, {
        type: success ? 'success' : 'error',
        title,
      });

      if (success) {
        setIsEditing(false);
        setHasChanges(false);
      }
    });
  };

  return (
    <VStack alignItems="stretch" gap={6}>
      <HStack>
        <PageTitle>Team Rule</PageTitle>
        <Visibility isVisible={isAdmin}>
          <>
            <Tooltip
              positioning={{ placement: 'top' }}
              content={`${isEditing ? 'Preview' : 'Write'}`}
            >
              <Button
                size="2xs"
                variant="ghost"
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? <Eye /> : <Pencil />}
              </Button>
            </Tooltip>

            <HStack marginLeft="auto">
              <Button
                hidden={!isEditing || isPending || !hasChanges}
                size="sm"
                variant="surface"
                colorPalette="whiteAlpha"
                onClick={() => {
                  setIsEditing(!isEditing);
                  setContent(defaultContent);
                }}
              >
                Cancel
              </Button>
              <Tooltip
                showArrow
                open={hasChanges}
                content="Not saved yet"
                positioning={{ placement: 'top' }}
                contentProps={{ css: { '--tooltip-bg': 'colors.red.500' } }}
              >
                <Button
                  size="sm"
                  disabled={isPending || !hasChanges}
                  onClick={onSubmit}
                >
                  <Save />
                  Save
                </Button>
              </Tooltip>
            </HStack>
          </>
        </Visibility>
      </HStack>
      <TextEditor
        editable={isAdmin && isEditing && !isPending}
        defaultContent={defaultContent}
        content={content}
        hasChanges={hasChanges}
        onChange={setContent}
      />
      <Separator />
      <Text fontSize="xs" color="GrayText">
        {rule?.updated_at &&
          `Last updated on ${formatDatetime(rule.updated_at)}`}
      </Text>
    </VStack>
  );
}
