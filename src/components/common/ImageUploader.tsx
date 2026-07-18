import {
  Avatar,
  AvatarFallbackProps,
  Box,
  Center,
  FileUpload,
  Skeleton,
} from '@chakra-ui/react';
import { ImageUp } from 'lucide-react';

import { toaster } from '@/components/ui/toaster';

const MAX_FILE_SIZE = 100_000; // 100 KB

export function notifyRejection(files: Array<{ errors: Array<string> }>) {
  if (!files.length) return;

  const tooLarge = files.some(({ errors }) =>
    errors.includes('FILE_TOO_LARGE'),
  );

  toaster.create({
    type: 'error',
    title: tooLarge
      ? 'Image must be smaller than 100 KB'
      : 'Only PNG or JPEG images are allowed',
  });
}

type ImageUploaderProps = Required<{
  src: Image;
  onChange: (file: File) => void;
}> &
  Partial<{
    fallback: AvatarFallbackProps['name'];
    state: 'editable' | 'disabled' | 'pending';
  }>;

export default function ImageUploader({
  src,
  fallback,
  state = 'editable',
  onChange,
}: ImageUploaderProps) {
  const isPending = state === 'pending';
  const isDisabled = state === 'disabled';
  const isHidden = isDisabled || isPending;

  return (
    <FileUpload.Root
      disabled={state !== 'editable'}
      maxFileSize={MAX_FILE_SIZE}
      accept={['image/png', 'image/jpeg']}
      onFileAccept={({ files }) => onChange(files[0])}
      onFileReject={({ files }) => notifyRejection(files)}
      alignItems="center"
    >
      <FileUpload.HiddenInput />
      <FileUpload.Trigger asChild disabled={isHidden} aria-label="Upload image">
        <Box
          position="relative"
          cursor={isHidden ? 'default' : 'pointer'}
          css={{ '&:hover .avatar-overlay': { opacity: 1 } }}
        >
          {isPending ? (
            <Skeleton width={32} height={32} />
          ) : (
            <Avatar.Root
              width={32}
              height={32}
              variant="outline"
              shape="rounded"
            >
              <Avatar.Fallback>{fallback}</Avatar.Fallback>
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
