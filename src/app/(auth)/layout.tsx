import { Metadata } from 'next';

import { Center, Container } from '@chakra-ui/react';

export const metadata: Metadata = {
  title: 'Auth',
  description: 'Authentication',
};

export default function LoginLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <Center
      p="2rem"
      w="100vw"
      h="100vh"
      bgSize="cover"
      bgPos="center"
      bgImage="url('/bg-layer.jpeg')"
    >
      <Container
        maxW="xl"
        p="8"
        rounded="lg"
        backgroundColor="white"
        shadow="lg"
      >
        {children}
      </Container>
    </Center>
  );
}
