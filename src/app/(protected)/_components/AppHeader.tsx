'use client';

import dynamic from 'next/dynamic';
import NextImage from 'next/image';

import { HStack, Image, SkeletonCircle, Stack } from '@chakra-ui/react';

import HeaderLogo from '@/assets/images/header-logo.webp';
import Breadcrumbs from './Breadcrumbs';

const AccountMenu = dynamic(() => import('./AccountMenu'), {
  ssr: false,
  loading: () => <SkeletonCircle size={8} />,
});
const MobileSidebar = dynamic(() => import('./MobileSidebar'), { ssr: false });

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
