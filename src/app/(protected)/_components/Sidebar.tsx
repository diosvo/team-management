'use client';

import Link, { useLinkStatus } from 'next/link';
import { usePathname } from 'next/navigation';
import {
  memo,
  useEffect,
  useMemo,
  useRef,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react';

import {
  Button,
  Link as ChakraLink,
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
  SCROLL_AREA_CSS,
  SIDEBAR_CSS,
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
    <Spinner size="xs" colorPalette="gray" marginLeft="auto" borderWidth={1} />
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

// Memoized so a `pathname` change only re-renders the old and new active
// buttons instead of the whole list.
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
      <Icon
        as={icon}
        size="sm"
        color={isDisabled ? undefined : isActive ? 'black' : 'gray.500'}
      />
      {isExpanded && label}
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
        fontWeight={isActive ? 500 : 400}
        justifyContent={isExpanded ? 'flex-start' : 'center'}
        variant={isActive ? 'surface' : 'ghost'}
        paddingInline={isExpanded ? undefined : 2}
        disabled={isDisabled}
        asChild={!isDisabled}
        css={SIDEBAR_CSS}
      >
        {isDisabled ? (
          content
        ) : (
          <Link href={href}>
            {content}
            {isExpanded && <LoadingIndicator />}
          </Link>
        )}
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
                _highlighted={{
                  color: `${color}.700`,
                  backgroundColor: `${color}.100`,
                }}
                _hover={{ cursor: 'pointer' }}
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

type SidebarProps = {
  isExpanded: boolean;
  setIsExpanded: Dispatch<SetStateAction<boolean>>;
};

export default function Sidebar({
  isExpanded = true,
  setIsExpanded,
}: SidebarProps) {
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

  const rootRef = useRef<HTMLDivElement>(null);
  const scrollTimeout = useRef<ReturnType<typeof setTimeout>>(null);

  const handleScroll = () => {
    rootRef.current?.setAttribute('data-scrolling', '');
    if (scrollTimeout.current) clearTimeout(scrollTimeout.current);

    scrollTimeout.current = setTimeout(
      () => rootRef.current?.removeAttribute('data-scrolling'),
      800,
    );
  };

  useEffect(
    () => () => {
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    },
    [],
  );

  const toggleLabel = isExpanded ? 'Collapse menu' : 'Expand menu';

  return (
    <VStack
      ref={rootRef}
      position="relative"
      height="full"
      alignItems="stretch"
      paddingBlock={4}
      paddingInline={2}
      css={SIDEBAR_CSS}
    >
      <Tooltip
        showArrow
        content={toggleLabel}
        positioning={{ placement: 'right' }}
      >
        <IconButton
          size="2xs"
          position="absolute"
          variant="outline"
          backgroundColor="white"
          top={isExpanded ? 2 : 1}
          right={0}
          zIndex={1}
          transform="translateX(50%)"
          css={TOGGLE_CSS}
          _hover={{ backgroundColor: 'gray.50' }}
          aria-label={toggleLabel}
          onClick={() => setIsExpanded((prev) => !prev)}
        >
          <Icon as={isExpanded ? ChevronLeft : ChevronRight} />
        </IconButton>
      </Tooltip>

      <VStack
        flex="1"
        minHeight={0}
        overflowY="auto"
        alignItems="stretch"
        marginInlineEnd={-2} // re-inset the content with padding.
        paddingInlineEnd={2}
        css={SCROLL_AREA_CSS}
        onScroll={handleScroll}
      >
        {visibleGroups.map(({ title, items }, index) => (
          <VStack key={title} alignItems="stretch" marginTop={index && 4}>
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
