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
        {/* Reserve intrinsic size to prevent CLS while scaling to fit. */}
        <img src="/squiggle.svg" alt="Squiggle" width={580} height={23} />
      </Image>
    </Heading>
  );
}
