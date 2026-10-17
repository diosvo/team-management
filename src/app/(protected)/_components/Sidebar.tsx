import Link, { useLinkStatus } from 'next/link';
import { usePathname } from 'next/navigation';
import { memo, useEffect, useMemo, useRef, type ReactNode } from 'react';

import {
  Button,
  Flex,
  Icon,
  IconButton,
  Separator,
  Span,
  Spinner,
  Text,
  VStack,
} from '@chakra-ui/react';
import { ChevronLeft, ChevronRight, type LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Tooltip } from '@/components/ui/tooltip';
import usePermissions from '@/hooks/use-permissions';

import {
  BUTTON_CONFIG,
  FADE_CSS,
  NAV_INSET,
  SCROLL_AREA_CSS,
  SIDEBAR_GROUP,
  TOGGLE_CSS,
  navLabel,
} from '../_helpers/utils';

function LoadingIndicator() {
  const { pending } = useLinkStatus();
  if (!pending) return null;

  return (
    <Spinner
      size="xs"
      colorPalette="gray"
      marginLeft="auto"
      marginInlineEnd={2}
      borderWidth={1}
    />
  );
}

type NavButtonProps = {
  href: string;
  label: string;
  icon: LucideIcon;
  isActive: boolean;
  isExpanded: boolean;
  isDisabled?: boolean;
};

// Memoized: a route change re-renders only the old and new active buttons.
const NavButton = memo(function NavButton({
  href,
  label,
  icon,
  isActive,
  isExpanded,
  isDisabled = false,
}: NavButtonProps) {
  const content = (
    <>
      {/* Icon container with centered icon and flexible collapse behavior */}
      <Span
        display="flex"
        justifyContent="center"
        paddingInline={NAV_INSET}
        minWidth={0}
      >
        <Icon
          as={icon}
          size="sm"
          transition="color 0.2s"
          color={isDisabled ? undefined : isActive ? 'black' : 'gray.600'}
        />
      </Span>
      {/* Zero-basis so it collapses to nothing without stealing icon width. */}
      <Span
        display="flex"
        alignItems="center"
        flex="1 1 0"
        minWidth={0}
        overflow="hidden"
        opacity={isExpanded ? 1 : 0}
        aria-hidden={!isExpanded}
        css={FADE_CSS}
      >
        <Span
          flex={1}
          minWidth={0}
          paddingInlineEnd={4}
          textAlign="start"
          truncate
        >
          {label}
        </Span>
        {!isDisabled && <LoadingIndicator />}
      </Span>
    </>
  );

  return (
    <Tooltip
      showArrow
      content={label}
      disabled={isExpanded || isDisabled}
      positioning={{ placement: 'right' }}
    >
      <Button
        {...BUTTON_CONFIG}
        variant={isActive ? 'surface' : 'ghost'}
        fontWeight={isActive ? 500 : 400}
        color={isActive ? 'black' : 'gray.600'}
        // Spacing lives on the slots so the icon can centre itself when collapsed.
        gap={0}
        paddingInline={0}
        overflow="hidden"
        disabled={isDisabled}
        aria-label={label}
        asChild={!isDisabled}
      >
        {isDisabled ? (
          content
        ) : (
          <Link href={href} aria-current={isActive ? 'page' : undefined}>
            {content}
          </Link>
        )}
      </Button>
    </Tooltip>
  );
});

type SidebarToggleProps = {
  isExpanded: boolean;
  onToggle: () => void;
};

/** Compose inside `<Sidebar>` on the desktop rail. */
export function SidebarToggle({ isExpanded, onToggle }: SidebarToggleProps) {
  const t = useTranslations('shell.sidebar');
  const label = isExpanded ? t('collapseMenu') : t('expandMenu');

  return (
    <Tooltip showArrow content={label} positioning={{ placement: 'right' }}>
      <IconButton
        size="2xs"
        position="absolute"
        // Centred on the first group header row (root padding + half row).
        top={3}
        right={0}
        zIndex={1}
        transform="translateX(50%)"
        variant="outline"
        backgroundColor="white"
        _hover={{ backgroundColor: 'gray.50' }}
        css={TOGGLE_CSS}
        aria-label={label}
        onClick={onToggle}
      >
        <Icon as={isExpanded ? ChevronLeft : ChevronRight} />
      </IconButton>
    </Tooltip>
  );
}

type SidebarProps = {
  isExpanded: boolean;
  /** Slot for `<SidebarToggle />`; the mobile drawer leaves it empty. */
  children?: ReactNode;
};

export default function Sidebar({ isExpanded, children }: SidebarProps) {
  const pathname = usePathname();
  const { can } = usePermissions();
  const t = useTranslations('shell.sidebar');
  const tNav = useTranslations('shell.nav');

  const visibleGroups = useMemo(
    () =>
      SIDEBAR_GROUP.flatMap(({ title, items }) => {
        const visible = items.filter(({ resource }) => can(resource, 'view'));
        return visible.length ? [{ title, items: visible }] : [];
      }),
    [can],
  );

  // `data-scrolling` on the root fades the toggle out while scrolling.
  const rootRef = useRef<HTMLDivElement>(null);
  const scrollTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);

  const handleScroll = () => {
    rootRef.current?.setAttribute('data-scrolling', '');
    clearTimeout(scrollTimeout.current);
    scrollTimeout.current = setTimeout(
      () => rootRef.current?.removeAttribute('data-scrolling'),
      800,
    );
  };

  useEffect(() => () => clearTimeout(scrollTimeout.current), []);

  return (
    <VStack
      ref={rootRef}
      position="relative"
      height="full"
      alignItems="stretch"
      paddingBlock={4}
    >
      {children}

      {/* Explicit inset: scrollbar gutters are 0px with overlay scrollbars. */}
      <VStack
        as="nav"
        aria-label={t('mainNav')}
        flex={1}
        minHeight={0}
        overflowY="auto"
        alignItems="stretch"
        gap={4}
        paddingInline={2}
        css={SCROLL_AREA_CSS}
        onScroll={handleScroll}
      >
        {visibleGroups.map(({ title, items }) => (
          <VStack key={title} alignItems="stretch">
            {/* Fixed height; title and separator cross-fade in place. */}
            <Flex position="relative" height={4} alignItems="center">
              <Text
                textStyle="overline"
                color="gray.700"
                marginLeft={NAV_INSET}
                truncate
                opacity={isExpanded ? 1 : 0}
                aria-hidden={!isExpanded}
                css={FADE_CSS}
              >
                {t(`groups.${title}`)}
              </Text>
              <Separator
                position="absolute"
                insetInline={0}
                opacity={isExpanded ? 0 : 1}
                aria-hidden={isExpanded}
                css={FADE_CSS}
              />
            </Flex>
            {items.map(({ resource, icon, disabled }) => {
              const href = `/${resource}`;
              return (
                <NavButton
                  key={resource}
                  icon={icon}
                  href={href}
                  label={navLabel(tNav, resource)}
                  isActive={pathname === href}
                  isExpanded={isExpanded}
                  isDisabled={disabled}
                />
              );
            })}
          </VStack>
        ))}
      </VStack>
    </VStack>
  );
}
