import {
  Button,
  type ButtonProps,
  HStack,
  type StackProps,
} from '@chakra-ui/react';
import { Plus } from 'lucide-react';

import Authorized from '@/components/Authorized';
import PageTitle from '@/components/PageTitle';

import type { Resource } from '@/utils/permissions';

type PageHeaderProps = Required<{
  title: string;
}> &
  Partial<{
    /** Controls rendered on the trailing edge (buttons, dialog triggers). */
    children: React.ReactNode;
  }> &
  Omit<StackProps, 'title' | 'children'>;

/**
 * Title row shared by every list page: the page title on the left and any
 * actions on the right.
 */
export default function PageHeader({
  title,
  children,
  ...rest
}: PageHeaderProps) {
  return (
    <HStack justifyContent="space-between" {...rest}>
      <PageTitle title={title} />
      {children != null && <HStack gap={{ base: 3, lg: 4 }}>{children}</HStack>}
    </HStack>
  );
}

type AddButtonProps = Required<{
  /** Resource whose `create` permission gates the button. */
  resource: Resource;
}> &
  Omit<ButtonProps, 'children'> &
  Partial<{
    /** Button label; defaults to "Add". */
    children: React.ReactNode;
  }>;

/**
 * The "+ Add" button that sits in a `PageHeader`, only rendered when the user
 * may create the given resource.
 */
export function AddButton({
  resource,
  children = 'Add',
  ...rest
}: AddButtonProps) {
  return (
    <Authorized resource={resource} action="create">
      <Button size={{ base: 'sm', md: 'md' }} {...rest}>
        <Plus />
        {children}
      </Button>
    </Authorized>
  );
}
