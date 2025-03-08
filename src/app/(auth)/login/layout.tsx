import { Center } from '@chakra-ui/react';

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
      {children}
    </Center>
  );
}
