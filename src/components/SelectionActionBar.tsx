import { ActionBar, Button, Portal } from '@chakra-ui/react';
import { Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { PropsWithChildren } from 'react';

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
  const t = useTranslations('components.selectionActionBar');
  const tCommon = useTranslations('common');

  return (
    <ActionBar.Root open={open}>
      <Portal>
        <ActionBar.Positioner>
          <ActionBar.Content
            maxWidth="calc(100vw - {spacing.8})"
            flexWrap="wrap"
            justifyContent="center"
          >
            <ActionBar.SelectionTrigger>
              {t('selected', { count: selectionCount })}
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
              {tCommon('delete')}
            </Button>
          </ActionBar.Content>
        </ActionBar.Positioner>
      </Portal>
    </ActionBar.Root>
  );
}
