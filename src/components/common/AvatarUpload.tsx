import { useEffect, useState } from 'react';

import {
  Avatar,
  AvatarFallbackProps,
  AvatarImageProps,
  Box,
  Center,
  FileUpload,
} from '@chakra-ui/react';
import { Camera } from 'lucide-react';

export default function AvatarUpload({
  onChange,
  isPending,
  disabled,
  src,
  fallback,
}: {
  onChange: (file: File) => void;
  src?: AvatarImageProps['src'];
  disabled?: boolean;
  fallback?: AvatarFallbackProps['name'];
  isPending?: boolean;
}) {
  const [preview, setPreview] = useState<Nullable<string>>(null);

  useEffect(() => {
    if (!preview) return;
    return () => URL.revokeObjectURL(preview);
  }, [preview]);

  const handleFileChange = (file: File) => {
    if (!file) return;

    setPreview(URL.createObjectURL(file));
    onChange(file);
  };

  return (
    <FileUpload.Root
      disabled={disabled}
      maxFileSize={1024 * 1024} // 1MB
      accept="image/*"
      onFileChange={({ acceptedFiles }) => handleFileChange(acceptedFiles[0])}
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
          <Avatar.Root width={32} height={32} variant="outline" shape="rounded">
            <Avatar.Fallback name={fallback} />
            <Avatar.Image src={preview ?? src ?? undefined} />
          </Avatar.Root>
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
