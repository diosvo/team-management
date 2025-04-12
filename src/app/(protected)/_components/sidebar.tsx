'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ForwardRefExoticComponent,
  ReactNode,
  RefAttributes,
  use,
} from 'react';

import { Button, Icon, Text, VStack } from '@chakra-ui/react';
import { Crown, LucideProps, ShieldUser } from 'lucide-react';

import { userRoles } from '@/drizzle/schema';
import { useUser } from '@/hooks/use-user';
import { hrefPath, SIDEBAR_GROUP } from '../_helpers/utils';

function NavButton({
  href,
  icon,
  disabled = false,
  children,
}: {
  href: string;
  icon: ForwardRefExoticComponent<
    Omit<LucideProps, 'ref'> & RefAttributes<SVGSVGElement>
  >;
  disabled?: boolean;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Button
      w="full"
      size="sm"
      borderRadius="sm"
      justifyContent="flex-start"
      disabled={disabled}
      variant={isActive ? 'subtle' : 'ghost'}
      colorScheme={isActive ? 'blue' : 'gray'}
      color={isActive ? 'inherit' : 'gray.500'}
      asChild={!disabled}
    >
      {disabled ? (
        <div>
          {icon && <Icon as={icon} />} {children}
        </div>
      ) : (
        <Link href={href}>
          {icon && <Icon as={icon} />} {children}
        </Link>
      )}
    </Button>
  );
}

export default function Sidebar() {
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
            return (
              <NavButton
                key={item.text}
                href={path}
                icon={item.icon}
                disabled={item.disabled}
              >
                {item.text}
              </NavButton>
            );
          })}
        </VStack>
      ))}

      <VStack align="stretch" mt="auto">
        <NavButton href="/rules" icon={Crown}>
          Team Rules
        </NavButton>
        {user?.roles?.includes(userRoles[0]) && (
          <NavButton href="/admin" icon={ShieldUser}>
            Administration
          </NavButton>
        )}
      </VStack>
    </VStack>
  );
}
