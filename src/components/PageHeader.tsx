import { Button, type ButtonProps, HStack } from '@chakra-ui/react';
import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';

import Authorized from '@/components/Authorized';
import PageTitle from '@/components/PageTitle';

import type { Resource } from '@/utils/permissions';

type PageHeaderProps = {
  title: string;
  /** Trailing controls (buttons, dialog triggers). */
  children?: React.ReactNode;
};

/** List-page title row: title left, actions right. */
export default function PageHeader({ title, children }: PageHeaderProps) {
  return (
    <HStack justifyContent="space-between" flexWrap="wrap" gap={3}>
      <PageTitle title={title} />
      {children != null && (
        <HStack gap={{ base: 3, lg: 4 }} flexWrap="wrap">
          {children}
        </HStack>
      )}
    </HStack>
  );
}

type AddButtonProps = Required<{
  /** Resource whose `create` permission gates the button. */
  resource: Resource;
}> &
  Omit<ButtonProps, 'children'> &
  Partial<{
    /** Button label; defaults to `common.add` ("Add"). */
    children: React.ReactNode;
  }>;

/** "+ Add" button, shown only if the user can create `resource`. */
export function AddButton({ resource, children, ...rest }: AddButtonProps) {
  const tCommon = useTranslations('common');

  return (
    <Authorized resource={resource} action="create">
      <Button {...rest}>
        <Plus />
        {children ?? tCommon('add')}
      </Button>
    </Authorized>
  );
}
