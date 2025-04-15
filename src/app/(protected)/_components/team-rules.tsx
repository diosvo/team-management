import { Button, Dialog, Portal } from '@chakra-ui/react';
import { Crown } from 'lucide-react';

import TextEditor from '@/components/text-editor';
import { CloseButton } from '@/components/ui/close-button';
import { executeRule } from '@/features/rule/actions/rule';
import { RuleValues } from '@/features/rule/schemas/rule';

export default function TeamRules({
  editable,
  team_id,
}: {
  editable: boolean;
  team_id: string;
}) {
  // const [isEditing, setIsEditing] = useState(false);

  async function onSubmit(values: RuleValues) {
    const { error, message: description } = await executeRule(values);

    if (error) {
      //
    } else {
      //
    }
  }

  return (
    <Dialog.Root size="lg">
      <Dialog.Trigger asChild>
        <Button size="sm" variant="ghost" justifyContent="flex-start">
          <Crown /> Team Rules
        </Button>
      </Dialog.Trigger>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Regulation</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <TextEditor
                editable={editable}
                content={editable ? 'Editable content' : 'Read-only content'}
                onSave={async (content) =>
                  await onSubmit({
                    content,
                    team_id,
                  })
                }
                onReset={() => {}}
              />
            </Dialog.Body>
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
