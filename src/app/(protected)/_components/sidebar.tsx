'use client';

import Link, { useLinkStatus } from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ForwardRefExoticComponent,
  ReactNode,
  RefAttributes,
  useTransition,
} from 'react';

import {
  Button,
  Icon,
  Separator,
  Spinner,
  Text,
  VStack,
} from '@chakra-ui/react';
import { Crown, LucideProps } from 'lucide-react';

import { dialog } from '@/components/ui/dialog';

import { usePermissions } from '@/hooks/use-permissions';

import { getRule } from '@/features/rule/actions/rule';
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
  isExpanded = true,
}: {
  href: string;
  icon: ForwardRefExoticComponent<
    Omit<LucideProps, 'ref'> & RefAttributes<SVGSVGElement>
  >;
  disabled?: boolean;
  children: ReactNode;
  isExpanded?: boolean;
}) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Button
      size={{ base: 'xs', md: 'sm' }}
      justifyContent={isExpanded ? 'flex-start' : 'center'}
      disabled={disabled}
      variant={isActive ? 'subtle' : 'ghost'}
      color={isActive ? 'inherit' : 'GrayText'}
      paddingInline={isExpanded ? undefined : 2}
      title={isExpanded ? undefined : String(children)}
      asChild
    >
      {disabled ? (
        <div>
          {icon && <Icon as={icon} />} {isExpanded && children}
        </div>
      ) : (
        <Link href={href}>
          {icon && <Icon as={icon} />}
          {isExpanded && children}
          {isExpanded && <LoadingIndicator />}
        </Link>
      )}
    </Button>
  );
}

export default function Sidebar({
  isExpanded = true,
}: {
  isExpanded?: boolean;
}) {
  const isAdmin = usePermissions();
  const [isPending, startTransition] = useTransition();

  const openRuleDialog = () => {
    startTransition(async () => {
      const rule = await getRule();
      console.log(rule);

      dialog.open('team-rule', {
        children: <TeamRule editable={isAdmin} rule={rule} />,
      });
    });
  };

  return (
    <VStack
      align="stretch"
      height="full"
      paddingBlock={4}
      paddingInline={2}
      gap={isExpanded ? 6 : 2}
      overflow="hidden"
    >
      {SIDEBAR_GROUP.map(({ title, items }, index) => (
        <VStack key={title} align="stretch">
          {isExpanded ? (
            <Text
              fontSize={{ base: '2xs', md: 'xs' }}
              marginLeft={{ base: 3, md: 4 }}
            >
              {title}
            </Text>
          ) : (
            index > 0 && <Separator />
          )}

          {items.map(({ text, icon, disabled }) => {
            const path = hrefPath(text);
            return (
              <NavButton
                key={text}
                href={path}
                icon={icon}
                disabled={disabled}
                isExpanded={isExpanded}
              >
                {text}
              </NavButton>
            );
          })}
        </VStack>
      ))}

      <VStack align="stretch" marginTop="auto">
        <Button
          size={{ base: 'xs', md: 'sm' }}
          variant="ghost"
          justifyContent={isExpanded ? 'flex-start' : 'center'}
          title="Team Rule"
          paddingInline={isExpanded ? undefined : 2}
          loading={isPending}
          onClick={openRuleDialog}
        >
          <Icon as={Crown} color="orange.focusRing" />
          {isExpanded && 'Team Rule'}
        </Button>
      </VStack>
      <dialog.Viewport />
    </VStack>
  );
}
