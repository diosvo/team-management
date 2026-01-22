import { Box, Skeleton, SkeletonText, Stack } from '@chakra-ui/react';

export default function Loading() {
  return (
    <Stack>
      <Box>
        <Skeleton height={9} width={28} />
        <Skeleton height={10} width="100%" marginBlock={4} />
      </Box>
      <SkeletonText noOfLines={6} gap={4} />
    </Stack>
  );
}
