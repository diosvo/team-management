import { Anton } from 'next/font/google';
import NextImage from 'next/image';

import {
  Box,
  Center,
  Heading,
  HStack,
  Separator,
  Text,
  VStack,
} from '@chakra-ui/react';

import { getYearsActive } from '@/app/(protected)/_helpers/utils';
import BackgroundLayer from '@/assets/images/bg-layer.webp';

const anton = Anton({ subsets: ['latin'], weight: '400' });

export default function AchievementHero() {
  return (
    <Center
      position="relative"
      borderRadius="md"
      paddingBlock={{ base: 8, md: 14 }}
    >
      <Box
        aria-hidden="true"
        position="absolute"
        inset={0}
        opacity={0.08}
        pointerEvents="none"
        style={{
          maskImage: 'linear-gradient(to left, black, transparent 65%)',
          WebkitMaskImage: 'linear-gradient(to left, black, transparent 65%)',
        }}
      >
        <NextImage
          fill
          priority
          sizes="100vw"
          src={BackgroundLayer}
          style={{ objectFit: 'cover' }}
          alt="Team Logo"
        />
      </Box>

      <VStack position="relative" gap={4} textAlign="center">
        <Heading
          color="primary"
          fontWeight={400}
          textTransform="uppercase"
          fontFamily={anton.style.fontFamily}
          size={{ base: '3xl', md: '5xl', lg: '6xl' }}
        >
          Our Journey. Our Pride.
        </Heading>

        <HStack width="full" maxWidth="lg" gap={4}>
          <Separator flex={1} borderColor="primary" opacity={0.4} />
          <Text
            color="gray.700"
            fontWeight="bold"
            letterSpacing="wide"
            textTransform="uppercase"
            fontSize={{ base: '2xs', md: 'sm' }}
          >
            {getYearsActive} of playing together
          </Text>
          <Separator flex={1} borderColor="primary" opacity={0.4} />
        </HStack>

        <Text color="gray.600" fontSize={{ base: 'sm', md: 'md' }}>
          Every season. Every challenge. Every achievement.
        </Text>
      </VStack>
    </Center>
  );
}
