import { Avatar, Box, Center, FileUpload, Skeleton } from '@chakra-ui/react';
import { Camera } from 'lucide-react';

import { toaster } from '@/components/ui/toaster';

const MAX_FILE_SIZE = 100_000; // 100 KB

export function notifyRejection(files: Array<{ errors: string[] }>) {
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
    fallback: string;
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
      <FileUpload.Trigger
        asChild
        disabled={isPending}
        aria-label="Upload image"
      >
        <Box
          position="relative"
          cursor={isDisabled ? 'default' : 'pointer'}
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
              <Avatar.Fallback name={fallback} />
              <Avatar.Image src={src ?? undefined} />
            </Avatar.Root>
          )}
          <Center
            hidden={isDisabled}
            position="absolute"
            className="avatar-overlay"
            backgroundColor="blackAlpha.600"
            inset={0}
            opacity={0}
            borderRadius="md"
            transition="opacity 0.2s"
          >
            <Camera size={24} color="white" />
          </Center>
        </Box>
      </FileUpload.Trigger>
    </FileUpload.Root>
  );
}
