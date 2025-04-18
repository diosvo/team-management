'use client';

import { useState, useTransition } from 'react';

import { Button, Dialog, Icon, Portal, Text } from '@chakra-ui/react';
import { Crown, Eye, Pencil } from 'lucide-react';

import TextEditor from '@/components/text-editor';
import { CloseButton } from '@/components/ui/close-button';
import { toaster } from '@/components/ui/toaster';
import { Tooltip } from '@/components/ui/tooltip';
import Visibility from '@/components/visibility';

import { Rule } from '@/drizzle/schema';
import { executeRule } from '@/features/rule/actions/rule';
import { RuleValues } from '@/features/rule/schemas/rule';

interface TeamRulesProps {
  editable: boolean;
  team_id: string;
  rule: Partial<Rule>;
}

export default function TeamRules({ editable, team_id, rule }: TeamRulesProps) {
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
    <Dialog.Root size="lg">
      <Dialog.Trigger asChild>
        <Button size="sm" variant="ghost" justifyContent="flex-start">
          <Icon as={Crown} color="orange.focusRing" />
          Team Rules
        </Button>
      </Dialog.Trigger>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title display="flex" alignItems="baseline" gap={1}>
                <Text>Regulation</Text>
                <Visibility isVisible={editable}>
                  <Tooltip
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
                </Visibility>
              </Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
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
            </Dialog.Body>
            <Dialog.Footer justifyContent="flex-start">
              <Text fontSize="xs" color="gray.500">
                Last updated on {rule.updated_at!.toLocaleString('vi-VN')}
              </Text>
            </Dialog.Footer>
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
