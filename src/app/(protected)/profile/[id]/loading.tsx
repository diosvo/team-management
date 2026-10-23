import { Center, Skeleton, Stack } from '@chakra-ui/react';

import PageTitle from '@/components/PageTitle';

const TABS = ['Overview', 'Personal', 'Team'];

export default function Loading() {
  return (
    <>
      <PageTitle title="Profile Details" />

      {/* ProfileLayout: tabs on top on phones (`sm`), beside the card from `md` (`lg`). */}
      <Center>
        <Stack
          direction={{ base: 'column', md: 'row' }}
          width={{ base: 'full', xl: '3/4' }}
          maxWidth="5xl"
          gap={4}
        >
          <Stack direction={{ base: 'row', md: 'column' }} gap={2}>
            {TABS.map((tab) => (
              <Skeleton
                key={tab}
                height={{ base: 9, md: 11 }}
                flex={{ base: 1, md: 'none' }}
                width={{ md: 24 }}
              />
            ))}
          </Stack>
          <Skeleton height="266px" flex={1} />
        </Stack>
      </Center>

      {/* Last updated on ... */}
      <Skeleton height={5} width={56} />
    </>
  );
}
