'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { Button, Icon, Text, VStack } from '@chakra-ui/react';
import { Crown } from 'lucide-react';

import { hrefPath, SIDEBAR_GROUP } from '../_helpers/utils';

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <VStack align="stretch" py="4" px="2" gap={6} height="full">
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

      <Button mt="auto" justifyContent="flex-start" size="sm" variant="ghost">
        <Crown /> Team Rules
      </Button>
    </VStack>
  );
}
