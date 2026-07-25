'use client';

import Link, { useLinkStatus } from 'next/link';
import { usePathname } from 'next/navigation';
import React, {
  type ForwardRefExoticComponent,
  type PropsWithChildren,
  type RefAttributes,
} from 'react';

import {
  Button,
  Icon,
  IconButton,
  Separator,
  Spinner,
  Text,
  VStack,
} from '@chakra-ui/react';
import { ChevronLeft, ChevronRight, LucideProps } from 'lucide-react';

import { Tooltip } from '@/components/ui/tooltip';
import usePermissions from '@/hooks/use-permissions';
import { SIDEBAR_GROUP, segmentToLabel } from '../_helpers/utils';

const BUTTON_CONFIG = {
  size: { base: 'xs', md: 'sm', mdTo2xl: 'md' },
  color: 'gray.700',
  _hover: {
    _icon: {
      animation: 'wiggle 1s linear infinite',
    },
  },
} as const;

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
}: PropsWithChildren<{
  href: string;
  icon: ForwardRefExoticComponent<
    Omit<LucideProps, 'ref'> & RefAttributes<SVGSVGElement>
  >;
  disabled?: boolean;
  isExpanded?: boolean;
}>) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Tooltip
      showArrow
      disabled={isExpanded || disabled}
      content={isExpanded ? undefined : String(children)}
      positioning={{ placement: 'right' }}
    >
      <Button
        {...BUTTON_CONFIG}
        fontWeight={isActive ? 500 : 400}
        justifyContent={isExpanded ? 'flex-start' : 'center'}
        variant={isActive ? 'surface' : 'ghost'}
        paddingInline={isExpanded ? undefined : 2}
        disabled={disabled}
        asChild
      >
        {disabled ? (
          <div>
            {icon && <Icon as={icon} size="sm" fontWeight={400} />}
            {isExpanded && children}
          </div>
        ) : (
          <Link href={href}>
            <Icon size="sm" as={icon} color={isActive ? 'black' : 'gray.500'} />
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
  setIsExpanded,
}: {
  isExpanded: boolean;
  setIsExpanded: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const { can } = usePermissions();
  const visibleItems = SIDEBAR_GROUP.flatMap(({ title, items }) => {
    const filtered = items.filter(({ resource }) => can(resource, 'view'));
    return filtered.length > 0 ? [{ title, items: filtered }] : [];
  });

  return (
    <VStack
      position="relative"
      height="full"
      alignItems="stretch"
      paddingBlock={4}
      paddingInline={2}
    >
      <Tooltip
        showArrow
        content={isExpanded ? 'Collapse menu' : 'Expand menu'}
        positioning={{ placement: 'right' }}
      >
        <IconButton
          aria-label={isExpanded ? 'Collapse menu' : 'Expand menu'}
          size="2xs"
          variant="outline"
          backgroundColor="white"
          position="absolute"
          top={isExpanded ? 2 : 1}
          right={0}
          transform="translateX(50%)"
          zIndex={1}
          _hover={{
            backgroundColor: 'gray.50',
          }}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <Icon as={isExpanded ? ChevronLeft : ChevronRight} />
        </IconButton>
      </Tooltip>
      <VStack flex="1" minHeight={0} alignItems="stretch" overflowY="auto">
        {visibleItems.map(({ title, items }, index) => (
          <VStack
            key={title}
            alignItems="stretch"
            marginTop={index > 0 ? 4 : 0}
          >
            {isExpanded ? (
              <Text
                fontSize={9}
                color="gray.700"
                letterSpacing="wider"
                marginLeft={{ base: 3, md: 4 }}
              >
                {title.toUpperCase()}
              </Text>
            ) : (
              <Separator />
            )}
            {items.map(({ resource, icon, disabled }) => (
              <NavButton
                key={resource}
                icon={icon}
                href={`/${resource}`}
                disabled={disabled}
                isExpanded={isExpanded}
              >
                {segmentToLabel(resource)}
              </NavButton>
            ))}
          </VStack>
        ))}
      </VStack>
    </VStack>
  );
}
