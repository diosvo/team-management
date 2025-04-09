'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Suspense } from 'react';

import Loading from '@/components/loading';
import {
  Avatar,
  Button,
  Grid,
  GridItem,
  Highlight,
  HStack,
  Icon,
  Separator,
  Text,
  VStack,
} from '@chakra-ui/react';

import { Book } from 'lucide-react';
import { hrefPath, SIDEBAR_GROUP } from './_helpers/utils';

const SidebarContent = () => {
  const pathname = usePathname();

  return (
    <VStack align="stretch" py="4" px="2" gap={6}>
      {SIDEBAR_GROUP.map(({ title, items }) => (
        <VStack key={title} align="stretch">
          <Text fontSize="xs" marginLeft="4">
            {title}
          </Text>

          {items.map((item) => {
            const path = hrefPath(item.text);
            const isActive = pathname === path;

            return (
              <Button
                key={item.text}
                w="full"
                size="sm"
                borderRadius="md"
                justifyContent="flex-start"
                disabled={item.disabled}
                variant={isActive ? 'subtle' : 'ghost'}
                colorScheme={isActive ? 'blue' : 'gray'}
                color={isActive ? 'inherit' : 'gray.500'}
                asChild
              >
                {item.disabled ? (
                  <div>
                    <Icon as={item.icon} size="sm" /> {item.text}
                  </div>
                ) : (
                  <Link href={path}>
                    <Icon as={item.icon} size="sm" /> {item.text}
                  </Link>
                )}
              </Button>
            );
          })}
        </VStack>
      ))}
    </VStack>
  );
};

export default function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <Grid h="100vh" templateColumns="256px 1fr" templateRows="auto 1fr">
      <GridItem
        rowSpan={2}
        w="256px"
        bg="white"
        borderRightWidth="1px"
        borderRightStyle="solid"
        borderRightColor="gray.300"
      >
        <SidebarContent />
      </GridItem>

      <GridItem bg="white">
        <HStack align="center" py="2" px="4">
          <Button size="sm" variant="ghost">
            <Book /> Team Rules
          </Button>

          <HStack ml="auto">
            <Highlight
              query="Teamwork"
              styles={{ px: '0.5', bg: 'orange.subtle', color: 'orange.fg' }}
            >
              Teamwork makes the dream work
            </Highlight>

            <Avatar.Root variant="subtle" size="sm">
              <Avatar.Fallback name="Diosvo" />
              <Avatar.Image src="https://picsum.photos/200" />
            </Avatar.Root>
          </HStack>
        </HStack>
        <Separator />
      </GridItem>

      <GridItem p="4" overflow="auto">
        <Suspense fallback={<Loading />}>{children}</Suspense>
      </GridItem>
    </Grid>
  );
}
