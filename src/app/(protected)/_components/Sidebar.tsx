'use client';

import Link, { useLinkStatus } from 'next/link';
import { usePathname } from 'next/navigation';
import React, {
  ForwardRefExoticComponent,
  PropsWithChildren,
  RefAttributes,
} from 'react';

import {
  Button,
  Icon,
  Separator,
  Spinner,
  Text,
  VStack,
} from '@chakra-ui/react';
import { LucideProps, PanelLeftOpen, PanelRightOpen } from 'lucide-react';

import { Tooltip } from '@/components/ui/tooltip';

import { hrefPath, SIDEBAR_GROUP } from '../_helpers/utils';

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
            <Icon size="sm" fontWeight={isActive ? 500 : 400} as={icon} />
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
  return (
    <VStack
      height="full"
      alignItems="stretch"
      paddingBlock={4}
      paddingInline={2}
      gap={isExpanded ? 6 : 2}
    >
      {SIDEBAR_GROUP.map(({ title, items }) => (
        <VStack key={title} alignItems="stretch">
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
      <VStack marginTop="auto" alignItems="stretch">
        <Separator marginInline={-2} />
        <Tooltip
          showArrow
          disabled={isExpanded}
          content={!isExpanded && 'Expand menu'}
          positioning={{ placement: 'right' }}
        >
          <Button
            {...BUTTON_CONFIG}
            variant="ghost"
            fontWeight={400}
            justifyContent={isExpanded ? 'flex-start' : 'center'}
            paddingInline={isExpanded ? undefined : 2}
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <Icon size="sm" as={isExpanded ? PanelRightOpen : PanelLeftOpen} />
            {isExpanded && 'Collapse menu'}
          </Button>
        </Tooltip>
      </VStack>
    </VStack>
  );
}
