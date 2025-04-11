'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { use } from 'react';

import { Button, Icon, Text, VStack } from '@chakra-ui/react';
import { Crown, ShieldUser } from 'lucide-react';

import { userRoles } from '@/drizzle/schema';
import { useUser } from '@/hooks/use-user';
import { hrefPath, SIDEBAR_GROUP } from '../_helpers/utils';

export default function Sidebar() {
  const pathname = usePathname();
  const { userPromise } = useUser();
  const user = use(userPromise);

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
                borderRadius="sm"
                justifyContent="flex-start"
                disabled={item.disabled}
                variant={isActive ? 'subtle' : 'ghost'}
                colorScheme={isActive ? 'blue' : 'gray'}
                color={isActive ? 'inherit' : 'gray.500'}
                asChild
              >
                {item.disabled ? (
                  <div>
                    <Icon as={item.icon} /> {item.text}
                  </div>
                ) : (
                  <Link href={path}>
                    <Icon as={item.icon} /> {item.text}
                  </Link>
                )}
              </Button>
            );
          })}
        </VStack>
      ))}

      <VStack align="stretch" mt="auto">
        <Button size="sm" justifyContent="flex-start" variant="ghost">
          <Crown /> Team Rules
        </Button>
        {user?.roles?.includes(userRoles[0]) && (
          <Button size="sm" justifyContent="flex-start" variant="ghost" asChild>
            <Link href="admin">
              <ShieldUser /> Administration
            </Link>
          </Button>
        )}
      </VStack>
    </VStack>
  );
}
