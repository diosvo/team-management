import { Heading, Image } from '@chakra-ui/react';

type PageTitleProps = {
  title: string;
};

export default function PageTitle({ title }: PageTitleProps) {
  return (
    <Heading
      position="relative"
      color="primary"
      fontStyle="italic"
      fontWeight="bold"
      maxWidth="fit-content"
      size={{ base: 'xl', md: '2xl' }}
    >
      {title}
      <Image position="absolute" loading="lazy" alt="Squiggle" asChild>
        <img src="/squiggle.svg" alt="Squiggle" />
      </Image>
    </Heading>
  );
}
