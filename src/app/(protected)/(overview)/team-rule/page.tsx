import { Metadata } from 'next';

import { Stack } from '@chakra-ui/react';

import { getRule } from '@/actions/rule';

import RuleEditor from './_components/RuleEditor';

export const metadata: Metadata = {
  title: 'Rule',
  description: 'Rule applies to all team members.',
};

export default async function TeamRulePage() {
  const rule = await getRule();

  return (
    <Stack gap={10}>
      <RuleEditor rule={rule} />
    </Stack>
  );
}
