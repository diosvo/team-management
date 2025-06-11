'use client';

import { useEffect, useState, useTransition } from 'react';

import {
  Button,
  HStack,
  Icon,
  Separator,
  Text,
  VStack,
} from '@chakra-ui/react';
import { Eye, Pencil, Save, TimerReset } from 'lucide-react';

import PageTitle from '@/components/page-title';
import TextEditor from '@/components/text-editor';
import { toaster } from '@/components/ui/toaster';
import { Tooltip } from '@/components/ui/tooltip';
import Visibility from '@/components/visibility';

import { NullishRule } from '@/drizzle/schema/rule';
import { usePermissions } from '@/hooks/use-permissions';
import { formatDatetime } from '@/utils/formatter';

import { executeRule } from '@/features/rule/actions/rule';

export default function RuleEditor({ rule }: { rule: NullishRule }) {
  const { isAdmin } = usePermissions();

  const defaultContent = rule?.content || '';
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
        description: 'Updating rules...',
      });

      const { error, message: description } = await executeRule(content);

      toaster.update(id, {
        type: error ? 'error' : 'success',
        description,
      });

      if (!error) {
        setIsEditing(false);
        setHasChanges(false);
      }
    });
  };

  return (
    <VStack align="stretch" gap={6}>
      <HStack>
        <PageTitle>Team Rule</PageTitle>
        <Visibility isVisible={isAdmin}>
          <>
            <Tooltip
              positioning={{ placement: 'right-end' }}
              content={`${isEditing ? 'Preview' : 'Enable'} editing`}
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
              <Text
                fontSize="sm"
                color="GrayText"
                opacity={hasChanges ? 1 : 0}
                transition="all 0.1s ease-in-out"
              >
                Not saved yet
              </Text>
              <Button
                size="sm"
                variant="outline"
                disabled={isPending || !hasChanges}
                onClick={() => setContent(defaultContent)}
              >
                <Icon as={TimerReset} color="tomato" />
                Reset
              </Button>
              <Button
                size="sm"
                disabled={isPending || !hasChanges}
                onClick={onSubmit}
              >
                <Save />
                Save
              </Button>
            </HStack>
          </>
        </Visibility>
      </HStack>
      <TextEditor
        // key={resetKey}
        editable={isAdmin && isEditing && !isPending}
        content={content}
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
