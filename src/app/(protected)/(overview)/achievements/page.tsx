import { Metadata } from 'next';

import { getAchievements } from '@/actions/achievement';

import AchievementFooter from './_components/AchievementFooter';
import AchievementHeader from './_components/AchievementHeader';
import AchievementHero from './_components/AchievementHero';
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
      <AchievementHero />
      <AchievementTimeline achievements={achievements} />
      {achievements.length > 0 && <AchievementFooter />}
    </>
  );
}
