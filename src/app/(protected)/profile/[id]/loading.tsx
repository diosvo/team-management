import { getTranslations } from 'next-intl/server';
import { HStack, SimpleGrid, Skeleton, VStack } from '@chakra-ui/react';

import PageTitle from '@/components/PageTitle';

export default async function Loading() {
  const t = await getTranslations('profile');

  return (
    <>
      <PageTitle title={t('title')} />

      {/* Mirrors ProfileLayout: header card, then the two detail cards. */}
      <VStack
        alignItems="stretch"
        gap={4}
        width="full"
        maxWidth="5xl"
        marginInline="auto"
      >
        <HStack
          gap={{ base: 4, md: 6 }}
          padding={4}
          borderWidth="1px"
          borderRadius="l3"
        >
          <Skeleton boxSize={{ base: 20, md: 28 }} borderRadius="l2" />
          <VStack flex={1} gap={{ base: 2, md: 3 }} alignItems="start">
            <Skeleton
              height={{ base: 7, md: 8 }}
              width={{ base: 40, md: 56 }}
            />
            <HStack>
              <Skeleton height={5} width={16} />
              <Skeleton height={5} width={12} />
              <Skeleton height={5} width={16} />
            </HStack>
            <Skeleton height={4} width={{ base: 44, md: 64 }} />
          </VStack>
        </HStack>
        <SimpleGrid columns={{ base: 1, lg: 2 }} gap={4}>
          <Skeleton height="220px" />
          <Skeleton height="340px" />
        </SimpleGrid>
      </VStack>

      {/* Last updated on ... */}
      <Skeleton height={5} width={56} marginInlineStart="auto" />
    </>
  );
}
