'use client';

import Link, { useLinkStatus } from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ForwardRefExoticComponent,
  ReactNode,
  RefAttributes,
  use,
  useMemo,
} from 'react';

import { Button, Icon, Spinner, Text, VStack } from '@chakra-ui/react';
import { LucideProps, ShieldUser } from 'lucide-react';

import Visibility from '@/components/visibility';
import { Rule } from '@/drizzle/schema';
import { useUser } from '@/hooks/use-user';
import { UserRole } from '@/utils/enum';

import { hrefPath, SIDEBAR_GROUP } from '../_helpers/utils';
import TeamRule from './team-rule';

function LoadingIndicator() {
  const { pending } = useLinkStatus();
  return (
    pending && (
      <Spinner size="xs" colorPalette="gray" ml="auto" borderWidth="1px" />
    )
  );
}

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
          {icon && <Icon as={icon} />}
          {children}
          <LoadingIndicator />
        </Link>
      )}
    </Button>
  );
}

export default function Sidebar() {
  const { userPromise } = useUser();
  const user = use(userPromise);

  const isAdmin = useMemo(() => {
    return user?.roles?.includes(UserRole.SUPER_ADMIN) || false;
  }, [user]);

  return (
    <VStack align="stretch" py={4} px={2} gap={6} height="full">
      {SIDEBAR_GROUP.map(({ title, items }) => (
        <VStack key={title} align="stretch">
          <Text fontSize="xs" marginLeft={4}>
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
        <TeamRule
          editable={isAdmin}
          team_id={user?.team_id as string}
          rule={user?.team.rule as Rule}
        />

        <Visibility isVisible={isAdmin}>
          <NavButton href="/admin" icon={ShieldUser}>
            Administration
          </NavButton>
        </Visibility>
      </VStack>
    </VStack>
  );
}
