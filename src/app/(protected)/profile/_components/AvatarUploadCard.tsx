'use client';

import { useTransition } from 'react';

import {
  Avatar,
  Box,
  Center,
  FileUpload,
  Stack,
  Text,
  VStack,
} from '@chakra-ui/react';
import { Camera } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { toaster } from '@/components/ui/toaster';

import type { User } from '@/drizzle/schema/user';
import authClient from '@/lib/auth-client';

import { uploadAvatar } from '@/actions/user';
import { useUserAvatar } from '@/hooks/use-avatar';
import { useSessionContext } from '@/providers/session';

export default function AvatarUploadCard({ user }: { user: User }) {
  const [isPending, startTransition] = useTransition();

  const { refetch } = authClient.useSession();
  const { user: sessionUser } = useSessionContext();

  const { data: image } = useUserAvatar(user.image);
  const canUpdate = sessionUser?.id === user.id && !isPending;

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
        <FileUpload.Root
          disabled={!canUpdate}
          maxFileSize={1024 * 1024} // 1MB
          accept="image/*"
          onFileChange={({ acceptedFiles }) =>
            handleFileChange(acceptedFiles[0])
          }
          alignItems="center"
        >
          <FileUpload.HiddenInput />
          <FileUpload.Trigger asChild aria-label="Upload image">
            <Box
              position="relative"
              cursor={canUpdate ? 'pointer' : 'default'}
              borderRadius="full"
              css={{ '&:hover .avatar-overlay': { opacity: 1 } }}
            >
              <Avatar.Root width={32} height={32} variant="outline">
                <Avatar.Fallback name={user.name} />
                <Avatar.Image src={image ?? undefined} />
              </Avatar.Root>
              <Center
                hidden={!canUpdate}
                className="avatar-overlay"
                position="absolute"
                borderRadius="full"
                backgroundColor="blackAlpha.600"
                inset={0}
                opacity={0}
                transition="opacity 0.2s"
              >
                <Camera size={24} color="white" />
              </Center>
            </Box>
          </FileUpload.Trigger>
        </FileUpload.Root>
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
