import { ActionBar, Button, Portal } from '@chakra-ui/react';
import { Trash2 } from 'lucide-react';
import { PropsWithChildren } from 'react';

type SelectionActionBarProps = PropsWithChildren<{
  open: boolean;
  selectionCount: number;
  onDelete: () => void;
}>;

export default function SelectionActionBar({
  open,
  children,
  selectionCount,
  onDelete,
}: SelectionActionBarProps) {
  return (
    <ActionBar.Root open={open}>
      <Portal>
        <ActionBar.Positioner>
          <ActionBar.Content>
            <ActionBar.SelectionTrigger>
              {selectionCount} selected
            </ActionBar.SelectionTrigger>
            <ActionBar.Separator />
            {children}
            <Button
              size="sm"
              variant="outline"
              colorPalette="red"
              onClick={onDelete}
            >
              <Trash2 />
              Delete
            </Button>
          </ActionBar.Content>
        </ActionBar.Positioner>
      </Portal>
    </ActionBar.Root>
  );
}
