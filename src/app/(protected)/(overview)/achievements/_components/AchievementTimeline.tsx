import {
  Box,
  Circle,
  Grid,
  GridItem,
  Heading,
  HStack,
  Stack,
  Text,
  VStack,
} from '@chakra-ui/react';
import { Quote, Trophy } from 'lucide-react';

import { EmptyState } from '@/components/ui/empty-state';

import { ESTABLISHED_DATE } from '@/utils/constants';
import { formatDate } from '@/utils/formatter';

import { AchievementWithRelations } from '@/db/achievement';

import { Bebas_Neue } from 'next/font/google';
import {
  FOUNDING_STYLE,
  FOUNDING_YEAR,
  getYearTagline,
} from '../_helpers/utils';
import AchievementCard from './AchievementCard';

const neuse = Bebas_Neue({ subsets: ['latin'], weight: '400' });

type YearGroup = {
  year: number;
  items: Array<AchievementWithRelations>;
  /** The story of the year, borrowed from its first described honor */
  quote: Nullable<string>;
};

export default function AchievementTimeline({
  achievements,
}: {
  achievements: Array<AchievementWithRelations>;
}) {
  if (achievements.length === 0) {
    return (
      <EmptyState
        icon={<Trophy />}
        title="The trophy cabinet awaits its first honor"
        description="Record the club's achievements once a league has ended."
      />
    );
  }

  // Achievements arrive sorted by year (desc), so insertion order is kept.
  const byYear = new Map<number, Array<AchievementWithRelations>>();
  for (const achievement of achievements) {
    const items = byYear.get(achievement.year) ?? [];
    byYear.set(achievement.year, [...items, achievement]);
  }

  const groups: Array<YearGroup> = [...byYear.entries()].map(
    ([year, items]) => ({
      year,
      items,
      quote: items.find(({ description }) => description)?.description ?? null,
    }),
  );

  // Close the story with the founding year
  if (!byYear.has(FOUNDING_YEAR)) {
    groups.push({
      year: FOUNDING_YEAR,
      items: [],
      quote: 'One dream. One team.',
    });
  }

  return (
    <Stack gap={0}>
      {groups.map(({ year, items, quote }, index) => {
        const isLast = index === groups.length - 1;

        return (
          <Grid
            key={year}
            templateColumns={{ base: '72px 40px 1fr', md: '160px 56px 1fr' }}
            columnGap={{ base: 2, md: 4 }}
          >
            <GridItem>
              <Heading
                color="primary"
                fontWeight={400}
                fontStyle="italic"
                fontFamily={neuse.style.fontFamily}
                size={{ base: 'xl', md: '3xl' }}
              >
                {year}
              </Heading>
              <Text
                color="gray.500"
                fontSize={{ base: '2xs', md: 'sm' }}
                lineHeight="short"
              >
                {getYearTagline(groups.length - 1 - index)}
              </Text>
            </GridItem>

            <GridItem position="relative" aria-hidden="true">
              <Box
                position="absolute"
                left="50%"
                top={0}
                width="2px"
                marginLeft="-1px"
                backgroundColor="blackAlpha.100"
                height={isLast ? { base: '16px', md: '20px' } : 'full'}
              />
              <Circle
                position="absolute"
                left="50%"
                top={6}
                transform="translateX(-50%)"
                size={{ base: 1, md: 2 }}
                backgroundColor="blackAlpha.700"
              />
            </GridItem>

            <GridItem
              paddingBottom={{ base: 4, md: 6 }}
              marginBottom={{ base: 4, md: 6 }}
              borderBottomWidth={isLast ? undefined : '1px'}
              borderBottomColor="gray.100"
            >
              <Grid
                gap={{ base: 3, xl: 8 }}
                templateColumns={{ base: '1fr', xl: '1fr 360px' }}
              >
                <Stack gap={1}>
                  {items.length > 0 ? (
                    items.map((achievement) => (
                      <AchievementCard
                        key={achievement.achievement_id}
                        achievement={achievement}
                      />
                    ))
                  ) : (
                    <HStack gap={4} alignItems="start">
                      <Box color="primary">
                        <FOUNDING_STYLE.icon
                          size={20}
                          role="img"
                          aria-label={FOUNDING_STYLE.label}
                        />
                      </Box>
                      <VStack alignItems="stretch">
                        <Text fontWeight="semibold">
                          {FOUNDING_STYLE.label}
                        </Text>
                        <Text fontSize="sm" color="gray.600">
                          {formatDate(ESTABLISHED_DATE)}
                        </Text>
                      </VStack>
                    </HStack>
                  )}
                </Stack>

                {quote && (
                  <Box
                    position="relative"
                    alignSelf="center"
                    paddingLeft={4}
                    paddingRight={8}
                    borderLeftWidth={2}
                    borderLeftColor="red.200"
                  >
                    <Text fontSize="sm" color="gray.600">
                      {quote}
                    </Text>
                    <Box
                      aria-hidden="true"
                      position="absolute"
                      right={0}
                      bottom={0}
                      color="red.100"
                    >
                      <Quote size={28} fill="currentColor" strokeWidth={0} />
                    </Box>
                  </Box>
                )}
              </Grid>
            </GridItem>
          </Grid>
        );
      })}
    </Stack>
  );
}
