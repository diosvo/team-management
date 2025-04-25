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

import { Rule } from '@/drizzle/schema';
import { LOCALE } from '@/utils/constant';

import { executeRule } from '@/features/rule/actions/rule';
import { RuleValues } from '@/features/rule/schemas/rule';

interface TeamRuleProps {
  editable: boolean;
  team_id: string;
  rule: Partial<Rule>;
}

export default function TeamRule({ editable, team_id, rule }: TeamRuleProps) {
  const [isPending, startTransition] = useTransition();
  const [isEditing, setIsEditing] = useState<boolean>(false);

  function onSubmit(values: RuleValues) {
    startTransition(async () => {
      const id = toaster.create({
        type: 'loading',
        description: 'Updating rules...',
      });

      const { error, message: description } = await executeRule(values);

      toaster.update(id, {
        type: error ? 'error' : 'success',
        description,
      });

      setIsEditing(false);
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
          content={rule.content as string}
          onSave={(content: string) =>
            onSubmit({
              content,
              team_id,
            })
          }
        />
      </DialogBody>
      <DialogFooter justifyContent="flex-start">
        <Text fontSize="xs" color="GrayText">
          {rule.updated_at &&
            `Last updated on ${rule.updated_at.toLocaleString(LOCALE)}`}
        </Text>
      </DialogFooter>
    </>
  );
}
