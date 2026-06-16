'use client';

import NextLink from 'next/link';

import { Link as ChakraLink, LinkProps } from '@chakra-ui/react';

export function LeagueLink({
  name,
  ...props
}: { name: Nullish<string> } & LinkProps) {
  if (!name) return '-';

  const href = `/leagues?q=${encodeURIComponent(name)}`;

  return (
    <ChakraLink
      colorPalette="pink"
      focusRing="none"
      _hover={{
        textDecoration: 'pink dotted underline',
      }}
      {...props}
      onClick={(e) => e.stopPropagation()}
      asChild
    >
      <NextLink href={href} rel="noopener noreferrer" target="_blank">
        {name}
      </NextLink>
    </ChakraLink>
  );
}
