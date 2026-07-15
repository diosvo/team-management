import { Avatar, Box, Center, FileUpload, Skeleton } from '@chakra-ui/react';
import { Camera } from 'lucide-react';

import { toaster } from '@/components/ui/toaster';

const MAX_FILE_SIZE = 100_000; // 100 KB

type AvatarUploadProps = Required<{
  src: Image;
  onChange: (file: File) => void;
}> &
  Partial<{
    fallback: string;
    disabled: boolean;
    isPending: boolean;
  }>;

export default function AvatarUpload({
  src,
  fallback,
  disabled,
  isPending,
  onChange,
}: AvatarUploadProps) {
  return (
    <FileUpload.Root
      disabled={disabled || isPending}
      maxFileSize={MAX_FILE_SIZE}
      accept={['image/png', 'image/jpeg', 'image/jpg']}
      onFileAccept={({ files }) => {
        if (files[0]) onChange(files[0]);
      }}
      onFileReject={({ files }) => {
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
      }}
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
          cursor={disabled ? 'default' : 'pointer'}
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
            hidden={disabled}
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
