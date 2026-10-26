import type { Metadata } from 'next';

import { getTranslations } from 'next-intl/server';

import { getAchievements } from '@/actions/achievement';

import AchievementFooter from './_components/AchievementFooter';
import AchievementHeader from './_components/AchievementHeader';
import AchievementHero from './_components/AchievementHero';
import AchievementTimeline from './_components/AchievementTimeline';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('achievements.metadata');
  return { title: t('title'), description: t('description') };
}

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
