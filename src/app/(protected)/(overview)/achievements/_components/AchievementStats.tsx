import { SimpleGrid } from '@chakra-ui/react';

import { Stat } from '@/components/ui/stat';

import { ESTABLISHED_DATE } from '@/utils/constant';
import { AchievementType } from '@/utils/enum';

import { AchievementWithRelations } from '@/db/achievement';

import { PODIUM_TYPES } from '../_helpers/utils';

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
  const yearsActive =
    new Date().getFullYear() - new Date(ESTABLISHED_DATE).getFullYear() + 1;

  return (
    <SimpleGrid columns={{ base: 2, md: 4 }} gap={6}>
      <Stat label="Total Honors" value={achievements.length} color="red" />
      <Stat label="Championships" value={championships} color="yellow" />
      <Stat label="Podium Finishes" value={podiums} color="orange" />
      <Stat label="Years Active" value={yearsActive} unit="year" />
    </SimpleGrid>
  );
}
