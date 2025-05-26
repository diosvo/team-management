import { getRule } from '@/features/rule/actions/rule';
import RuleEditor from './_components/rule-editor';

export default async function TeamRulePage() {
  const rule = await getRule();

  return <RuleEditor rule={rule} />;
}
