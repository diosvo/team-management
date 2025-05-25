'use client';

import { useState, useTransition } from 'react';

import { Button, Text } from '@chakra-ui/react';
import { Eye, Pencil } from 'lucide-react';

import TextEditor from '@/components/text-editor';
import {
  DialogBody,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toaster } from '@/components/ui/toaster';
import { Tooltip } from '@/components/ui/tooltip';
import Visibility from '@/components/visibility';

import { formatDatetime } from '@/utils/formatter';

import { NullishRule } from '@/drizzle/schema';
import { executeRule } from '@/features/rule/actions/rule';

interface TeamRuleProps {
  editable: boolean;
  rule: NullishRule;
}

export default function TeamRule({ editable, rule }: TeamRuleProps) {
  const [isPending, startTransition] = useTransition();
  const [isEditing, setIsEditing] = useState<boolean>(false);

  function onSubmit(content: string) {
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
      }
    });
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle display="flex" alignItems="baseline" gap={1}>
          <Text>Regulation</Text>
          <Visibility isVisible={editable}>
            <Tooltip content={`${isEditing ? 'Preview' : 'Enable'} editing`}>
              <Button
                size="2xs"
                variant="ghost"
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? <Eye /> : <Pencil />}
              </Button>
            </Tooltip>
          </Visibility>
        </DialogTitle>
      </DialogHeader>
      <DialogBody>
        <TextEditor
          editable={editable && isEditing && !isPending}
          loading={isPending}
          content={rule?.content || ''}
          onSave={onSubmit}
        />
      </DialogBody>
      <DialogFooter justifyContent="flex-start">
        <Text fontSize="xs" color="GrayText">
          {rule?.updated_at &&
            `Last updated on ${formatDatetime(rule.updated_at)}`}
        </Text>
      </DialogFooter>
    </>
  );
}
