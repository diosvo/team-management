import { useTranslations } from 'next-intl';
import {
  Avatar,
  type AvatarFallbackProps,
  Box,
  type BoxProps,
  Center,
  FileUpload,
  Skeleton,
} from '@chakra-ui/react';
import { ImageUp } from 'lucide-react';

import { toaster } from '@/components/ui/toaster';

// Matches the server-side limit; Sharp shrinks the image after upload.
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

type RejectionMessages = Record<'tooLarge' | 'invalidType', string>;

const DEFAULT_REJECTION_MESSAGES: RejectionMessages = {
  tooLarge: 'Image must be smaller than 10 MB',
  invalidType: 'Only PNG or JPEG images are allowed',
};

export function notifyRejection(
  files: Array<{ errors: Array<string> }>,
  messages: RejectionMessages = DEFAULT_REJECTION_MESSAGES,
) {
  if (!files.length) return;

  const tooLarge = files.some(({ errors }) =>
    errors.includes('FILE_TOO_LARGE'),
  );

  toaster.create({
    type: 'error',
    title: tooLarge ? messages.tooLarge : messages.invalidType,
  });
}

type ImageUploaderProps = Required<{
  src: Nullable<string>;
  onChange: (file: File) => void;
}> &
  Partial<{
    fallback: AvatarFallbackProps['name'];
    state: 'editable' | 'disabled' | 'pending';
    /** Avatar width and height; responsive values allowed */
    size: BoxProps['boxSize'];
  }>;

export default function ImageUploader({
  src,
  fallback,
  state = 'editable',
  size = 32,
  onChange,
}: ImageUploaderProps) {
  const t = useTranslations('components.imageUploader');
  const isPending = state === 'pending';
  const isDisabled = state === 'disabled';
  const isHidden = isDisabled || isPending;

  return (
    <FileUpload.Root
      disabled={state !== 'editable'}
      maxFileSize={MAX_FILE_SIZE}
      accept={['image/png', 'image/jpeg']}
      onFileAccept={({ files: [file] }) => file && onChange(file)}
      onFileReject={({ files }) =>
        notifyRejection(files, {
          tooLarge: t('tooLarge'),
          invalidType: t('invalidType'),
        })
      }
      alignItems="center"
    >
      <FileUpload.HiddenInput />
      <FileUpload.Trigger asChild disabled={isHidden} aria-label={t('upload')}>
        <Box
          position="relative"
          cursor={isHidden ? 'default' : 'pointer'}
          css={{ '&:hover .avatar-overlay': { opacity: 1 } }}
        >
          {isPending ? (
            <Skeleton boxSize={size} />
          ) : (
            <Avatar.Root boxSize={size} variant="outline" shape="rounded">
              <Avatar.Fallback name={fallback} />
              <Avatar.Image src={src ?? undefined} />
            </Avatar.Root>
          )}
          <Center
            hidden={isHidden}
            position="absolute"
            className="avatar-overlay"
            backgroundColor="blackAlpha.600"
            inset={0}
            opacity={0}
            // Touch screens can't hover: keep the upload hint visible.
            css={{ '@media (hover: none)': { opacity: 0.6 } }}
            borderRadius="md"
            transition="opacity 0.2s"
          >
            <ImageUp size={24} color="white" />
          </Center>
        </Box>
      </FileUpload.Trigger>
    </FileUpload.Root>
  );
}
