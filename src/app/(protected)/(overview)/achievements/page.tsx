import { Metadata } from 'next';

import { getAchievements } from '@/actions/achievement';

import AchievementHeader from './_components/AchievementHeader';
import AchievementStats from './_components/AchievementStats';
import AchievementTimeline from './_components/AchievementTimeline';

export const metadata: Metadata = {
  title: 'Achievements',
  description: "The club's honors, year by year.",
};

export default async function AchievementsPage() {
  const achievements = await getAchievements();

  return (
    <>
      <AchievementHeader />
      <AchievementStats achievements={achievements} />
      <AchievementTimeline achievements={achievements} />
    </>
  );
}
