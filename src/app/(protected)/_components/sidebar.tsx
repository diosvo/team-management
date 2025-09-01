'use client';

import Link, { useLinkStatus } from 'next/link';
import { usePathname } from 'next/navigation';
import { ForwardRefExoticComponent, ReactNode, RefAttributes } from 'react';

import {
  Button,
  Icon,
  Separator,
  Spinner,
  Text,
  VStack,
} from '@chakra-ui/react';
import { LucideProps } from 'lucide-react';

import { Tooltip } from '@/components/ui/tooltip';

import { hrefPath, SIDEBAR_GROUP } from '../_helpers/utils';

function LoadingIndicator() {
  const { pending } = useLinkStatus();
  return (
    pending && (
      <Spinner
        size="xs"
        colorPalette="gray"
        marginLeft="auto"
        borderWidth={1}
      />
    )
  );
}

function NavButton({
  href,
  icon,
  disabled,
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
    <Tooltip
      disabled={isExpanded || disabled}
      content={isExpanded ? undefined : String(children)}
      positioning={{ placement: 'right' }}
    >
      <Button
        size={{ base: 'xs', md: 'sm', mdTo2xl: 'md' }}
        justifyContent={isExpanded ? 'flex-start' : 'center'}
        variant={isActive ? 'subtle' : 'ghost'}
        color={isActive ? 'primary' : 'GrayText'}
        backgroundColor={isActive ? 'red.50' : undefined}
        paddingInline={isExpanded ? undefined : 2}
        _hover={{
          color: isActive ? 'primary' : 'inherit',
          backgroundColor: disabled ? undefined : 'red.50',
          _icon: {
            animation: 'wiggle 1s linear infinite',
          },
        }}
        disabled={disabled}
        asChild
      >
        {disabled ? (
          <div>
            {icon && <Icon as={icon} />} {isExpanded && children}
          </div>
        ) : (
          <Link href={href}>
            <Icon as={icon} />
            {isExpanded && children}
            {isExpanded && <LoadingIndicator />}
          </Link>
        )}
      </Button>
    </Tooltip>
  );
}

export default function Sidebar({
  isExpanded = true,
}: {
  isExpanded?: boolean;
}) {
  return (
    <VStack
      height="full"
      alignItems="stretch"
      paddingBlock={4}
      paddingInline={2}
      gap={isExpanded ? 6 : 2}
      overflow="hidden"
    >
      {SIDEBAR_GROUP.map(({ title, items }, index) => (
        <VStack
          key={title}
          alignItems="stretch"
          marginTop={title ? undefined : 'auto'}
        >
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
    </VStack>
  );
}
