import { Metadata } from 'next';
import Image from 'next/image';
import { PropsWithChildren } from 'react';

import { Box, Center, Container } from '@chakra-ui/react';

import BackgroundLayer from '@/assets/images/bg-layer.webp';

export const metadata: Metadata = {
  title: 'Auth',
  description: 'Authentication',
};

export default async function AuthLayout({ children }: PropsWithChildren) {
  return (
    <Box height="100vh" position="relative">
      <Image
        fill
        priority
        quality={100}
        placeholder="blur"
        src={BackgroundLayer}
        style={{ objectFit: 'cover' }}
        alt="Saigon Rovers Basketball Club Background Layer"
      />
      <Center padding={8} height="100%">
        <Container
          padding={8}
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
