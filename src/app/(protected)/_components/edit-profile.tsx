'use client';

import {
  dialog,
  DialogBody,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field } from '@/components/ui/field';
import { User } from '@/drizzle/schema';
import {
  Button,
  DialogFooter,
  HStack,
  IconButton,
  NumberInput,
  VStack,
} from '@chakra-ui/react';
import { ArrowLeft, Save } from 'lucide-react';
import { useTransition } from 'react';
import UserInfo from './user-info';

export default function EditProfile({
  isAdmin,
  user,
}: {
  isAdmin: boolean;
  user: User;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <form>
      <DialogHeader display="flex" alignItems="center">
        <IconButton
          size="xs"
          variant="ghost"
          rounded="full"
          aria-label="Back to user information"
          onClick={() =>
            dialog.update('profile', {
              children: <UserInfo user={user} isAdmin={isAdmin} />,
            })
          }
        >
          <ArrowLeft />
        </IconButton>
        <DialogTitle>Edit profile</DialogTitle>
      </DialogHeader>
      <DialogBody>
        <VStack gap={4}>
          <HStack width="full" alignItems="flex-start">
            <Field label="Jersey Number">
              <NumberInput.Root size="sm" min={0} max={99}>
                <NumberInput.Control />
                <NumberInput.Input />
              </NumberInput.Root>
            </Field>
          </HStack>
        </VStack>
      </DialogBody>
      <DialogFooter>
        <Button type="submit" loading={isPending} loadingText="Saving...">
          <Save /> Update
        </Button>
      </DialogFooter>
    </form>
  );
}
