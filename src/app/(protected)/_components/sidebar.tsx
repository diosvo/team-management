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
    <Button
      size={{ base: 'xs', md: 'sm', lg: 'md' }}
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
        <VStack
          key={title}
          align="stretch"
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
