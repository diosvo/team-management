'use client';

import dynamic from 'next/dynamic';
import NextImage from 'next/image';

import { HStack, Image, SkeletonCircle } from '@chakra-ui/react';

import HeaderLogo from '@/assets/images/header-logo.webp';

const AccountMenu = dynamic(() => import('./AccountMenu'), {
  ssr: false,
  loading: () => <SkeletonCircle size={8} />,
});
const MobileSidebar = dynamic(() => import('./MobileSidebar'), { ssr: false });

export default function Header() {
  return (
    <HStack
      alignItems="center"
      paddingBlock={2}
      paddingInline={4}
      backgroundColor="gray.50"
    >
      <Image
        width={{ base: 132, sm: 144, md: 192 }}
        marginRight="auto"
        alt="Text Logo"
        asChild
      >
        <NextImage
          priority
          quality={100}
          placeholder="blur"
          src={HeaderLogo}
          alt="Text Logo"
        />
      </Image>

      <AccountMenu />
      <MobileSidebar />
    </HStack>
  );
}
