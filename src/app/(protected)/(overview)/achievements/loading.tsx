import {
  Box,
  Center,
  Circle,
  Grid,
  GridItem,
  HStack,
  Separator,
  Skeleton,
  SkeletonText,
  Stack,
  VStack,
} from '@chakra-ui/react';

/** Mirrors the timeline's anchor so the dot lines up with the first honor. */
const ANCHOR = '1.25rem';

/** Honors per year group, so the placeholder reads like a real timeline. */
const GROUPS = [2, 1, 1];

export default function AchievementsLoading() {
  return (
    <>
      {/* AchievementHeader */}
      <Skeleton height={10} />

      {/* AchievementHero */}
      <Center paddingBlock={{ base: 8, md: 14 }}>
        <VStack gap={4} width="full" maxWidth="lg">
          <Skeleton height={{ base: 8, md: 12, lg: 16 }} width="full" />
          <HStack width="full" gap={4}>
            <Separator flex={1} borderColor="primary" opacity={0.4} />
            <Skeleton
              height={{ base: 3, md: 4 }}
              width={{ base: 32, md: 48 }}
            />
            <Separator flex={1} borderColor="primary" opacity={0.4} />
          </HStack>
          <Skeleton height={4} width="70%" />
        </VStack>
      </Center>

      {/* AchievementTimeline */}
      <Stack gap={0}>
        {GROUPS.map((honors, index) => {
          const isLast = index === GROUPS.length - 1;

          return (
            <Grid
              key={index}
              templateColumns={{ base: '1fr 3fr', md: '1fr 8fr' }}
              columnGap={{ base: 4, md: 6 }}
            >
              <GridItem>
                <Stack gap={1}>
                  <Skeleton
                    height={{ base: 7, md: 9 }}
                    width={{ base: 12, md: 20 }}
                  />
                  <Skeleton height={{ base: 3, md: 4 }} width="80%" />
                </Stack>
              </GridItem>

              <GridItem
                position="relative"
                paddingLeft={{ base: 4, md: 8 }}
                paddingBottom={{ base: 4, md: 6 }}
                marginBottom={{ base: 4, md: 6 }}
                borderBottomWidth={isLast ? undefined : '1px'}
                borderBottomColor="gray.100"
              >
                <Box
                  aria-hidden="true"
                  position="absolute"
                  top={0}
                  left={0}
                  width="0.5"
                  transform="translateX(-50%)"
                  backgroundColor="blackAlpha.100"
                  height={isLast ? ANCHOR : undefined}
                  bottom={isLast ? undefined : { base: -4, md: -6 }}
                />
                <Circle
                  aria-hidden="true"
                  position="absolute"
                  top={ANCHOR}
                  left={0}
                  transform="translate(-50%, -50%)"
                  size={2}
                  backgroundColor="blackAlpha.700"
                />

                <Grid
                  gap={{ base: 3, xl: 8 }}
                  templateColumns={{ base: '1fr', xl: '2fr 1fr' }}
                >
                  <Stack gap={1}>
                    {Array.from({ length: honors }).map((_, honor) => (
                      <HStack
                        key={honor}
                        gap={4}
                        paddingBlock={2}
                        alignItems="start"
                      >
                        <Skeleton boxSize={5} />
                        <VStack flex={1} alignItems="stretch">
                          <Skeleton height={4} width="45%" />
                          <Skeleton height="0.875rem" width="65%" />
                        </VStack>
                      </HStack>
                    ))}
                  </Stack>

                  <Box
                    alignSelf="center"
                    paddingLeft={4}
                    paddingRight={8}
                    borderLeftWidth={2}
                    borderLeftColor="red.200"
                    hideBelow="xl"
                  >
                    <SkeletonText noOfLines={2} gap={2} height="0.875rem" />
                  </Box>
                </Grid>
              </GridItem>
            </Grid>
          );
        })}
      </Stack>

      {/* AchievementFooter */}
      <HStack gap={{ base: 4, md: 8 }}>
        <Separator flex={1} borderColor="gray.200" />
        <Skeleton height={4} width={{ base: 40, md: 56 }} />
        <Separator flex={1} borderColor="gray.200" />
      </HStack>
    </>
  );
}
