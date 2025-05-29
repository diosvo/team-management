import { getRule } from '@/features/rule/actions/rule';
import { Metadata } from 'next';
import RuleEditor from './_components/rule-editor';

export const metadata: Metadata = {
  title: 'Rule',
  description: 'Rule applies to all team members.',
};

export default async function TeamRulePage() {
  const rule = await getRule();

  return <RuleEditor rule={rule} />;
}
