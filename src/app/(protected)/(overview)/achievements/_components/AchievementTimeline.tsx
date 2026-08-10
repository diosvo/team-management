import { Bebas_Neue } from 'next/font/google';

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

import { FOUNDING_STYLE } from '@/utils/constants/achievement';
import { ESTABLISHED_DATE, FOUNDING_YEAR } from '@/utils/constants/app';
import { formatDate } from '@/utils/formatter';

import { AchievementWithRelations } from '@/db/achievement';

import AchievementCard from './AchievementCard';

const neuse = Bebas_Neue({ subsets: ['latin'], weight: '400' });
const YEAR_TAGLINES = [
  'Where It All Began.',
  'First Steps, Big Dreams.',
  'Rising Higher.',
  'The Foundation.',
  'Building Momentum.',
  'Relentless Growth.',
  'Stronger Together.',
];

function getYearTagline(index: number): string {
  if (index <= 0) return YEAR_TAGLINES[0];

  const [, ...rest] = YEAR_TAGLINES;
  return rest[(index - 1) % rest.length];
}

/**
 * Distance from the top of a row to the middle of its first line. The year,
 * the timeline dot and the first honor all anchor here so they read as one
 * line, whatever the heading size is at the current breakpoint.
 */
const ANCHOR = '1.25rem';

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
            templateColumns={{ base: '1fr 3fr', md: '1fr 8fr' }}
            columnGap={{ base: 4, md: 6 }}
          >
            <GridItem>
              <Heading
                color="primary"
                fontWeight={400}
                fontStyle="italic"
                fontFamily={neuse.style.fontFamily}
                size={{ base: 'xl', md: '3xl' }}
                lineHeight={`calc(${ANCHOR} * 2)`}
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
                  {items.length > 0 ? (
                    items.map((achievement) => (
                      <AchievementCard
                        key={achievement.achievement_id}
                        achievement={achievement}
                      />
                    ))
                  ) : (
                    <HStack gap={4} paddingBlock={2} alignItems="start">
                      <Box color={FOUNDING_STYLE.colorPalette}>
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
