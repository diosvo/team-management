import { SimpleGrid } from '@chakra-ui/react';

import { Stat } from '@/components/ui/stat';

import { AchievementType } from '@/utils/enum';

import { AchievementWithRelations } from '@/db/achievement';

import { getYearsActive, PODIUM_TYPES } from '../_helpers/utils';

export default function AchievementStats({
  achievements,
}: {
  achievements: Array<AchievementWithRelations>;
}) {
  const championships = achievements.filter(
    ({ type }) => type === AchievementType.CHAMPION,
  ).length;
  const podiums = achievements.filter(({ type }) =>
    PODIUM_TYPES.includes(type as (typeof PODIUM_TYPES)[number]),
  ).length;
  const yearsActive = getYearsActive();

  return (
    <SimpleGrid columns={{ base: 2, md: 4 }} gap={6}>
      <Stat label="Total Honors" value={achievements.length} color="red" />
      <Stat label="Championships" value={championships} color="yellow" />
      <Stat label="Podium Finishes" value={podiums} color="orange" />
      <Stat label="Years Active" value={yearsActive} unit="year" />
    </SimpleGrid>
  );
}
