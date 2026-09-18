'use client';

import Link, { useLinkStatus } from 'next/link';
import { usePathname } from 'next/navigation';
import { memo, useEffect, useMemo, useRef, type ReactNode } from 'react';

import {
  Button,
  Link as ChakraLink,
  Flex,
  HStack,
  Icon,
  IconButton,
  Menu,
  Portal,
  Separator,
  Span,
  Spinner,
  Text,
  VStack,
  type ColorPalette,
} from '@chakra-ui/react';
import {
  BookMarked,
  ChevronLeft,
  ChevronRight,
  Flag,
  Globe,
  type LucideIcon,
} from 'lucide-react';

import { Tooltip } from '@/components/ui/tooltip';
import usePermissions from '@/hooks/use-permissions';
import {
  BUTTON_CONFIG,
  FADE_CSS,
  NAV_INSET,
  SCROLL_AREA_CSS,
  SIDEBAR_GROUP,
  SOCIAL_LINKS,
  TOGGLE_CSS,
  segmentToLabel,
} from '../_helpers/utils';

const FEEDBACK_URL =
  'https://github.com/diosvo/team-management/issues/new?title=Feedback%20for%20%E2%80%9CTeam%20Rule%E2%80%9D&labels=maintenance&project=team-management&assignees=diosvo';

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
      {/* NAV_INSET padding pins the icon to the title's left edge; minWidth 0
          lets the slot shrink and re-centre on the collapsed rail. */}
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
          color={isDisabled ? undefined : isActive ? 'black' : 'gray.500'}
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
          flex="1"
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
        // Spacing lives on the slots so the icon can centre itself when collapsed.
        gap={0}
        paddingInline={0}
        overflow="hidden"
        disabled={isDisabled}
        aria-label={label}
        asChild={!isDisabled}
      >
        {isDisabled ? content : <Link href={href}>{content}</Link>}
      </Button>
    </Tooltip>
  );
});

function FooterLink({
  label,
  href,
  colorPalette,
  children,
}: {
  label: string;
  href: string;
  colorPalette: ColorPalette;
  children: ReactNode;
}) {
  return (
    <Tooltip content={label}>
      <IconButton
        size="2xs"
        variant="ghost"
        colorPalette={colorPalette}
        asChild
      >
        <ChakraLink
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={label}
        >
          {children}
        </ChakraLink>
      </IconButton>
    </Tooltip>
  );
}

function SocialMenu() {
  return (
    <Menu.Root>
      <Tooltip content="Social Links">
        <Span display="inline-flex">
          <Menu.Trigger asChild>
            <IconButton
              size="2xs"
              variant="ghost"
              colorPalette="blue"
              aria-label="Social Links"
            >
              <Globe />
            </IconButton>
          </Menu.Trigger>
        </Span>
      </Tooltip>
      <Portal>
        <Menu.Positioner>
          <Menu.Content>
            {SOCIAL_LINKS.map(({ label, href, color }) => (
              <Menu.Item
                key={label}
                value={label}
                cursor="pointer"
                _highlighted={{
                  color: `${color}.700`,
                  backgroundColor: `${color}.100`,
                }}
                asChild
              >
                <ChakraLink
                  href={`https://${href}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {label}
                </ChakraLink>
              </Menu.Item>
            ))}
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  );
}

type SidebarToggleProps = {
  isExpanded: boolean;
  onToggle: () => void;
};

/** Compose inside `<Sidebar>` on the desktop rail. */
export function SidebarToggle({ isExpanded, onToggle }: SidebarToggleProps) {
  const label = isExpanded ? 'Collapse menu' : 'Expand menu';

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

  const visibleGroups = useMemo(
    () =>
      SIDEBAR_GROUP.flatMap(({ title, items }) => {
        const visible = items.filter(({ resource }) => can(resource, 'view'));
        return visible.length ? [{ title, items: visible }] : [];
      }),
    [can],
  );

  // Scrollbar shows only while scrolling, via `data-scrolling` on the root.
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
      paddingInline={2}
    >
      {children}

      {/* Full bleed keeps the scrollbar flush with the border; symmetric gutters provide the inset and center the buttons. */}
      <VStack
        flex="1"
        minHeight={0}
        overflowY="auto"
        alignItems="stretch"
        gap={4}
        marginInline={-2}
        css={SCROLL_AREA_CSS}
        onScroll={handleScroll}
      >
        {visibleGroups.map(({ title, items }) => (
          <VStack key={title} alignItems="stretch">
            {/* Fixed height; title and separator cross-fade in place. */}
            <Flex position="relative" height={4} alignItems="center">
              <Text
                fontSize={9}
                color="gray.700"
                letterSpacing="wider"
                marginLeft={NAV_INSET}
                truncate
                opacity={isExpanded ? 1 : 0}
                aria-hidden={!isExpanded}
                css={FADE_CSS}
              >
                {title.toUpperCase()}
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
                  label={segmentToLabel(resource)}
                  isActive={pathname === href}
                  isExpanded={isExpanded}
                  isDisabled={disabled}
                />
              );
            })}
          </VStack>
        ))}
      </VStack>

      <Separator />

      <HStack justifyContent="center" flexWrap="wrap">
        <FooterLink label="Documentation" href="/docs" colorPalette="pink">
          <BookMarked />
        </FooterLink>
        <SocialMenu />
        <FooterLink
          label="Suggestions + feedback + ideas"
          href={FEEDBACK_URL}
          colorPalette="green"
        >
          <Flag />
        </FooterLink>
      </HStack>
    </VStack>
  );
}
