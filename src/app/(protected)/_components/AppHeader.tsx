'use client';

import NextImage from 'next/image';

import { HStack, Image, Stack } from '@chakra-ui/react';

import HeaderLogo from '@/assets/images/header-logo.webp';

import AccountMenu from './AccountMenu';
import Breadcrumbs from './Breadcrumbs';
import MobileSidebar from './MobileSidebar';

export default function Header() {
  return (
    <HStack
      paddingBlock={2}
      paddingInline={4}
      borderBottom="1px solid"
      borderBottomColor="gray.200"
    >
      <Image width={{ base: 132, sm: 144, md: 192 }} alt="Text Logo" asChild>
        <NextImage
          priority
          quality={100}
          placeholder="blur"
          src={HeaderLogo}
          alt="Text Logo"
        />
      </Image>

      <Stack hideBelow="lg" marginRight="auto" marginLeft={8}>
        <Breadcrumbs />
      </Stack>

      <HStack marginLeft="auto">
        <AccountMenu />
        <MobileSidebar />
      </HStack>
    </HStack>
  );
}
