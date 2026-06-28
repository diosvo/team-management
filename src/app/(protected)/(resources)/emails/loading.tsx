import { Separator, Skeleton, SkeletonText, Stack } from '@chakra-ui/react';

export default function Loading() {
  return (
    <Stack gap={{ base: 4, lg: 6 }}>
      {/* Sent Emails title */}
      <Skeleton height={9} width={48} />
      {/* Filters bar (search + filters) */}
      <Skeleton height={10} width="100%" />
      {/* Table rows */}
      <SkeletonText noOfLines={7} gap={2} height={10} />

      <Separator />

      {/* Email Preview title */}
      <Skeleton height={9} width={48} />
      {/* Accordion preview items */}
      <Skeleton height={10} width="100%" />
      <Skeleton height={10} width="100%" />
    </Stack>
  );
}
