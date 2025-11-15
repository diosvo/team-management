import { PropsWithChildren } from 'react';

import { Heading, HeadingProps, Image } from '@chakra-ui/react';

export default function PageTitle({
  children,
  ...props
}: PropsWithChildren<HeadingProps>) {
  return (
    <Heading
      position="relative"
      color="primary"
      fontStyle="italic"
      fontWeight="bold"
      letterSpacing="tight"
      maxWidth="fit-content"
      size={{ base: 'xl', md: '2xl' }}
      {...props}
    >
      {children}
      <Image position="absolute" loading="lazy" alt="Squiggle" asChild>
        <img src="/squiggle.svg" alt="Squiggle" />
      </Image>
    </Heading>
  );
}
