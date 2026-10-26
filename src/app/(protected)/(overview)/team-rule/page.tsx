import type { Metadata } from 'next';

import { getTranslations } from 'next-intl/server';

import { getRule } from '@/actions/rule';

import RuleEditor from './_components/RuleEditor';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('teamRule.metadata');
  return { title: t('title'), description: t('description') };
}

export default async function TeamRulePage() {
  const rule = await getRule();

  return <RuleEditor rule={rule} />;
}
