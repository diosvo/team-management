'use client';

import { useState, useTransition } from 'react';

import { Button, Icon, Text } from '@chakra-ui/react';
import { Crown, Eye, Pencil } from 'lucide-react';

import TextEditor from '@/components/text-editor';
import {
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
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

  async function onSubmit(values: RuleValues) {
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
    <DialogRoot size="lg">
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" justifyContent="flex-start">
          <Icon as={Crown} color="orange.focusRing" />
          Team Rule
        </Button>
      </DialogTrigger>
      <DialogContent>
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
            onSave={async (content: string) =>
              await onSubmit({
                content,
                team_id,
              })
            }
          />
        </DialogBody>
        <DialogFooter justifyContent="flex-start">
          <Text fontSize="xs" color="gray.500">
            {rule.updated_at &&
              `Last updated on ${rule.updated_at.toLocaleString(LOCALE)}`}
          </Text>
        </DialogFooter>
        <DialogCloseTrigger />
      </DialogContent>
    </DialogRoot>
  );
}
