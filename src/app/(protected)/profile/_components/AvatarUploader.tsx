'use client';

import { useTransition } from 'react';

import { Stack, Text, VStack } from '@chakra-ui/react';

import ImageUploader from '@/components/common/ImageUploader';
import { Card } from '@/components/ui/card';
import { toaster } from '@/components/ui/toaster';

import type { User } from '@/drizzle/schema/user';
import authClient from '@/lib/auth-client';
import { useSessionContext } from '@/providers/session';

import { uploadAvatar } from '@/actions/user';
import { useUserAvatar } from '@/hooks/use-image';

export default function AvatarUploader({ user }: { user: User }) {
  const [isPending, startTransition] = useTransition();

  const { refetch } = authClient.useSession();
  const { user: sessionUser } = useSessionContext();

  const { data: image, isLoading } = useUserAvatar(user.image);
  const canUpdate = sessionUser?.id === user.id;

  const handleFileChange = (file: File) => {
    const id = toaster.create({
      type: 'loading',
      title: 'Setting avatar...',
    });

    startTransition(async () => {
      const {
        success,
        message: title,
        data,
      } = await uploadAvatar(user.id, user.image, file);

      toaster.update(id, {
        type: success ? 'success' : 'error',
        title,
      });

      if (success && data) {
        // Just refresh the cached session so the header avatar updates without a second write.
        await refetch({ query: { disableCookieCache: true } });
      }
    });
  };

  return (
    <Card title={null}>
      <VStack gap={4}>
        <ImageUploader
          src={image as string}
          fallback={user.name}
          state={
            isPending || isLoading
              ? 'pending'
              : !canUpdate
                ? 'disabled'
                : 'editable'
          }
          onChange={handleFileChange}
        />
        <Stack gap={0} align="center">
          <Text fontWeight="medium">{user.name}</Text>
          <Text color="fg.muted" textStyle="sm">
            {user.role}
          </Text>
        </Stack>
      </VStack>
    </Card>
  );
}
