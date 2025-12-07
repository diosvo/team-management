import NextImage from 'next/image';

import { HStack, Image } from '@chakra-ui/react';

import HeaderLogo from '@/assets/images/header-logo.webp';
import Visibility from '@/components/Visibility';

import AccountMenu from './AccountMenu';
import MobileSidebar from './MobileSidebar';

export default function Header({ smallDevice }: { smallDevice: boolean }) {
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
      <Visibility isVisible={smallDevice} children={<MobileSidebar />} />
    </HStack>
  );
}
