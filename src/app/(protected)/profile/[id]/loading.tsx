import { Center, Skeleton, Stack, VStack } from '@chakra-ui/react';

export default function Loading() {
  return (
    <VStack align="stretch" gap={6}>
      {/* PageTitle */}
      <Skeleton height={9} width={48} />

      {/* ProfileLayout: centered tabs - vertical on md+, horizontal on base */}
      <Center>
        <Stack
          direction={{ base: 'column', md: 'row' }}
          width={{ base: '100%', md: '50%' }}
          gap={4}
        >
          {/* Tabs.List — Overview / Personal / Team */}
          <Stack
            direction={{ base: 'row', md: 'column' }}
            gap={2}
            flexShrink={0}
          >
            <Skeleton
              height={9}
              flex={{ base: 1, md: 'none' }}
              width={{ md: 24 }}
            />
            <Skeleton
              height={9}
              flex={{ base: 1, md: 'none' }}
              width={{ md: 24 }}
            />
            <Skeleton
              height={9}
              flex={{ base: 1, md: 'none' }}
              width={{ md: 24 }}
            />
          </Stack>

          {/* Tabs.Content — active section card */}
          <Skeleton height="266px" flex={1} />
        </Stack>
      </Center>

      {/* Last updated on ... */}
      <Skeleton height={4} width={56} />
    </VStack>
  );
}
