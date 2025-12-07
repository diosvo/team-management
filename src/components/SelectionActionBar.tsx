import { ActionBar, Button, Portal } from '@chakra-ui/react';

type SelectionActionBarProps = {
  open: boolean;
  selectionCount: number;
  onDelete: () => void;
};

export default function SelectionActionBar({
  open,
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
            <Button
              size="sm"
              variant="outline"
              colorPalette="red"
              onClick={onDelete}
            >
              Delete
            </Button>
          </ActionBar.Content>
        </ActionBar.Positioner>
      </Portal>
    </ActionBar.Root>
  );
}
