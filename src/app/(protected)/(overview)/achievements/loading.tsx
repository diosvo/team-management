import { Grid, HStack, Skeleton, Stack, VStack } from '@chakra-ui/react';

export default function AchievementsLoading() {
  return (
    <VStack align="stretch" gap={{ base: 4, lg: 6 }}>
      <HStack justifyContent="space-between">
        <Skeleton height={9} width={48} />
        <Skeleton height={10} width={28} />
      </HStack>

      <Skeleton height={{ base: '180px', md: '260px' }} />

      {Array.from({ length: 3 }).map((_, index) => (
        <Grid
          key={index}
          templateColumns={{ base: '72px 40px 1fr', md: '160px 56px 1fr' }}
          columnGap={{ base: 2, md: 4 }}
        >
          <Skeleton height={10} />
          <Skeleton borderRadius="full" boxSize={{ base: 10, md: 14 }} />
          <Stack gap={2}>
            <Skeleton height={12} />
            <Skeleton height={12} />
          </Stack>
        </Grid>
      ))}
    </VStack>
  );
}
