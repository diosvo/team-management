'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ForwardRefExoticComponent,
  ReactNode,
  RefAttributes,
  use,
  useMemo,
} from 'react';

import { Button, Icon, Text, VStack } from '@chakra-ui/react';
import { LucideProps, ShieldUser } from 'lucide-react';

import Visibility from '@/components/visibility';
import { useUser } from '@/hooks/use-user';

import { hrefPath, SIDEBAR_GROUP } from '../_helpers/utils';
import TeamRules from './team-rules';

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
      justifyContent="flex-start"
      disabled={disabled}
      variant={isActive ? 'subtle' : 'ghost'}
      colorScheme={isActive ? 'blue' : 'gray'}
      color={isActive ? 'inherit' : 'gray.500'}
      asChild
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

  const isAdmin = useMemo(() => {
    return user?.roles?.includes('SUPER_ADMIN') || false;
  }, [user]);

  return (
    <VStack align="stretch" py="4" px={2} gap={6} height="full">
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
        <TeamRules editable={isAdmin} team_id="" />

        <Visibility isVisible={isAdmin}>
          <NavButton href="/admin" icon={ShieldUser}>
            Administration
          </NavButton>
        </Visibility>
      </VStack>
    </VStack>
  );
}
