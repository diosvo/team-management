import type { Metadata } from 'next';
import Image from 'next/image';
import type { PropsWithChildren } from 'react';

import { Box, Center, Container } from '@chakra-ui/react';
import { getTranslations } from 'next-intl/server';

import BackgroundLayer from '@/assets/images/bg-layer.webp';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('auth.metadata');
  return { title: t('title'), description: t('description') };
}

export default async function AuthLayout({ children }: PropsWithChildren) {
  const t = await getTranslations('auth');

  return (
    <Box minHeight="100dvh" position="relative">
      <Image
        fill
        priority
        quality={100}
        placeholder="blur"
        src={BackgroundLayer}
        style={{ objectFit: 'cover' }}
        alt={t('backgroundAlt')}
      />
      <Center padding={{ base: 4, md: 8 }} minHeight="100dvh">
        <Container
          padding={{ base: 4, md: 8 }}
          maxWidth="xl"
          shadow="lg"
          rounded="lg"
          backgroundColor="white"
        >
          {children}
        </Container>
      </Center>
    </Box>
  );
}
