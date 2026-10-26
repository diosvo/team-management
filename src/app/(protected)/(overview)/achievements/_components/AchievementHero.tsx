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
import { useLocale, useTranslations } from 'next-intl';

import { getYearsActive } from '@/app/(protected)/_helpers/utils';
import BackgroundLayer from '@/assets/images/bg-layer.webp';

const anton = Anton({ subsets: ['latin'], weight: '400' });

export default function AchievementHero() {
  const t = useTranslations('achievements.hero');
  const locale = useLocale();

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
          alt={t('logoAlt')}
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
          {t('heading')}
        </Heading>

        <HStack width="full" maxWidth="lg" gap={4}>
          <Separator flex={1} borderColor="primary" opacity={0.4} />
          <Text
            color="gray.700"
            fontWeight="bold"
            letterSpacing="wide"
            textTransform="uppercase"
            fontSize={{ base: 'xs', md: 'sm' }}
          >
            {t('yearsActive', { duration: getYearsActive(locale) })}
          </Text>
          <Separator flex={1} borderColor="primary" opacity={0.4} />
        </HStack>

        <Text color="gray.600" fontSize={{ base: 'sm', md: 'md' }}>
          {t('tagline')}
        </Text>
      </VStack>
    </Center>
  );
}
