'use client';

import { useTransition } from 'react';
import { useTranslations } from 'next-intl';

import authClient from '@/lib/auth-client';

import { uploadAvatar } from '@/actions/user';
import ImageUploader from '@/components/common/ImageUploader';
import { toaster } from '@/components/ui/toaster';
import type { User } from '@/drizzle/schema/user';
import { useUserAvatar } from '@/hooks/use-image';
import { useSessionContext } from '@/providers/session';

export default function AvatarUploader({ user }: { user: User }) {
  const t = useTranslations('profile.avatar');
  const [isPending, startTransition] = useTransition();

  const { refetch } = authClient.useSession();
  const { user: sessionUser } = useSessionContext();

  const { data: image, isLoading } = useUserAvatar(user.image);
  const canUpdate = sessionUser?.id === user.id;

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

      if (success && data) {
        // Just refresh the cached session so the header avatar updates without a second write.
        await refetch({ query: { disableCookieCache: true } });
      }
    });
  };

  return (
    <ImageUploader
      src={image as string}
      fallback={user.name}
      size={{ base: 20, md: 28 }}
      state={
        isPending || isLoading
          ? 'pending'
          : !canUpdate
            ? 'disabled'
            : 'editable'
      }
      onChange={handleFileChange}
    />
  );
}
