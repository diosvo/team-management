'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import {
  Avatar,
  Box,
  Dialog,
  FileUpload,
  Image,
  Menu,
  Portal,
  Skeleton,
  useFileUpload,
} from '@chakra-ui/react';
import { ImageUp, SquareUserRound } from 'lucide-react';

import authClient from '@/lib/auth-client';

import { uploadAvatar } from '@/actions/user';
import { notifyRejection } from '@/components/common/ImageUploader';
import { CloseButton } from '@/components/ui/close-button';
import { toaster } from '@/components/ui/toaster';
import type { User } from '@/drizzle/schema/user';
import { useUserAvatar } from '@/hooks/use-image';
import usePermissions from '@/hooks/use-permissions';
import { useSessionContext } from '@/providers/session';

// Matches the server-side limit; Sharp shrinks the image after upload.
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const SIZE = { base: 20, md: 28 };
const ITEM_PROPS = { _hover: { cursor: 'pointer' } } as const;

// Owners/admins get a menu; others can only preview.
export default function AvatarUploader({ user }: { user: User }) {
  const t = useTranslations('profile.avatar');
  const tUploader = useTranslations('components.imageUploader');
  const [isPending, startTransition] = useTransition();
  const [previewOpen, setPreviewOpen] = useState(false);

  const { refetch } = authClient.useSession();
  const { user: sessionUser } = useSessionContext();
  const { isAdmin } = usePermissions();

  const { data: image, isLoading } = useUserAvatar(user.image);
  const isSelf = sessionUser?.id === user.id;
  const canUpdate = isSelf || isAdmin;

  const handleFileChange = (file: File) => {
    const id = toaster.create({
      type: 'loading',
      title: t('setting'),
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

      // Only our own avatar sits in the session (header menu); refresh it
      // w/o a second write.
      if (success && data && isSelf) {
        await refetch({ query: { disableCookieCache: true } });
      }
    });
  };

  const fileUpload = useFileUpload({
    maxFiles: 1,
    maxFileSize: MAX_FILE_SIZE,
    accept: ['image/png', 'image/jpeg'],
    disabled: !canUpdate || isPending,
    onFileAccept: ({ files: [file] }) => file && handleFileChange(file),
    onFileReject: ({ files }) =>
      notifyRejection(files, {
        tooLarge: tUploader('tooLarge'),
        invalidType: tUploader('invalidType'),
      }),
  });

  if (isPending || isLoading) return <Skeleton boxSize={SIZE} />;

  const avatar = (
    <Avatar.Root boxSize={SIZE} variant="outline" shape="rounded">
      <Avatar.Fallback name={user.name} />
      <Avatar.Image src={image ?? undefined} alt={user.name} />
    </Avatar.Root>
  );

  return (
    <>
      {canUpdate ? (
        <FileUpload.RootProvider value={fileUpload}>
          <FileUpload.HiddenInput />
          <Menu.Root>
            <Menu.Trigger
              aria-label={t('options')}
              borderRadius="md"
              cursor="pointer"
            >
              {avatar}
            </Menu.Trigger>
            <Portal>
              <Menu.Positioner>
                <Menu.Content minWidth={56}>
                  {image && (
                    <Menu.Item
                      value="see"
                      onClick={() => setPreviewOpen(true)}
                      {...ITEM_PROPS}
                    >
                      <SquareUserRound size={16} />
                      {t('see')}
                    </Menu.Item>
                  )}
                  <Menu.Item
                    value="choose"
                    onClick={() => fileUpload.openFilePicker()}
                    {...ITEM_PROPS}
                  >
                    <ImageUp size={16} />
                    {t('choose')}
                  </Menu.Item>
                </Menu.Content>
              </Menu.Positioner>
            </Portal>
          </Menu.Root>
        </FileUpload.RootProvider>
      ) : image ? (
        <Box
          as="button"
          aria-label={t('see')}
          borderRadius="md"
          cursor="zoom-in"
          onClick={() => setPreviewOpen(true)}
        >
          {avatar}
        </Box>
      ) : (
        avatar
      )}

      {image && (
        <Dialog.Root
          lazyMount
          unmountOnExit
          open={previewOpen}
          placement="center"
          size="md"
          onOpenChange={({ open }) => setPreviewOpen(open)}
        >
          <Portal>
            <Dialog.Backdrop />
            <Dialog.Positioner>
              <Dialog.Content>
                <Dialog.CloseTrigger asChild>
                  <CloseButton size="xs" />
                </Dialog.CloseTrigger>
                <Dialog.Header></Dialog.Header>
                <Dialog.Body paddingBottom={6}>
                  <Image
                    src={image}
                    alt={user.name}
                    width="full"
                    maxHeight="70vh"
                    objectFit="contain"
                    borderRadius="md"
                  />
                </Dialog.Body>
              </Dialog.Content>
            </Dialog.Positioner>
          </Portal>
        </Dialog.Root>
      )}
    </>
  );
}
