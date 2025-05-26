import NextImage from 'next/image';

import { Heading, Image } from '@chakra-ui/react';

import Squiggle from '@assets/images/squiggle.svg';

export default function PageTitle({ children }: { children: React.ReactNode }) {
  return (
    <Heading
      position="relative"
      color="primary"
      fontStyle="italic"
      fontWeight="bold"
      letterSpacing="tight"
      maxWidth="fit-content"
      size={{ base: 'xl', md: '2xl' }}
    >
      {children}
      <Image position="absolute" loading="lazy" alt="Squiggle" asChild>
        <NextImage src={Squiggle} alt="Squiggle" />
      </Image>
    </Heading>
  );
}
