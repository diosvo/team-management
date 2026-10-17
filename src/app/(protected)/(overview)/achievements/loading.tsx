import {
  Box,
  Circle,
  Grid,
  GridItem,
  HStack,
  Skeleton,
  SkeletonText,
  Stack,
  VStack,
} from '@chakra-ui/react';
import { useTranslations } from 'next-intl';

import { ButtonSkeleton } from '@/components/PageSkeleton';

import AchievementFooter from './_components/AchievementFooter';
import AchievementHero from './_components/AchievementHero';

/** Mirrors the timeline's anchor so the dot lines up with the first honor. */
const ANCHOR = '1.25rem';

/** Honors per year group, so the placeholder reads like a real timeline. */
const GROUPS = [2, 1, 1];

export default function AchievementsLoading() {
  const t = useTranslations('achievements.header');

  return (
    <>
      {/* AchievementHeader: the Record button waits on permissions. */}
      <ButtonSkeleton label={t('record')} />

      {/* Hero and footer are static: rendered for real. */}
      <AchievementHero />

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

      <AchievementFooter />
    </>
  );
}
