'use client';

import { useLinkStatus } from 'next/link';
import { usePathname } from 'next/navigation';
import {
  memo,
  useEffect,
  useMemo,
  useRef,
  type Dispatch,
  type SetStateAction,
} from 'react';

import {
  Button,
  HStack,
  Icon,
  IconButton,
  Link,
  Menu,
  Portal,
  Separator,
  Spinner,
  Text,
  VStack,
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
import Visibility from '@/components/Visibility';
import usePermissions from '@/hooks/use-permissions';
import {
  BUTTON_CONFIG,
  SCROLL_AREA_CSS,
  SIDEBAR_GROUP,
  SOCIAL_LINKS,
  TOGGLE_CSS,
  segmentToLabel,
} from '../_helpers/utils';

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

// When only `pathname` changes, just the two affected buttons
// (old active + new active) re-render instead of the whole list.
const NavButton = memo(function NavButton({
  href,
  label,
  icon,
  isActive,
  isExpanded,
  isDisabled,
}: NavButtonProps) {
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
      >
        {isDisabled ? (
          <>
            <Icon as={icon} size="sm" />
            {isExpanded && label}
          </>
        ) : (
          <Link href={href}>
            <Icon as={icon} size="sm" color={isActive ? 'black' : 'gray.500'} />
            {isExpanded && label}
            {isExpanded && <LoadingIndicator />}
          </Link>
        )}
      </Button>
    </Tooltip>
  );
});

export default function Sidebar({
  isExpanded = true,
  setIsExpanded,
}: {
  isExpanded: boolean;
  setIsExpanded: Dispatch<SetStateAction<boolean>>;
}) {
  const pathname = usePathname();
  const { can } = usePermissions();

  const visibleGroups = useMemo(
    () =>
      SIDEBAR_GROUP.flatMap(({ title, items }) => {
        const visible = items.filter(({ resource }) => can(resource, 'view'));
        return visible.length > 0 ? [{ title, items: visible }] : [];
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

  useEffect(() => {
    return () => {
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    };
  }, []);

  return (
    <VStack
      ref={rootRef}
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
          aria-label={isExpanded ? 'Collapse menu' : 'Expand menu'}
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
                label={segmentToLabel(resource)}
                isActive={pathname === `/${resource}`}
                isExpanded={isExpanded}
                isDisabled={disabled}
              />
            ))}
          </VStack>
        ))}
      </VStack>

      <Separator />

      <HStack justifyContent="center">
        <IconButton
          size="2xs"
          variant="ghost"
          colorPalette="pink"
          title="Documentation"
          asChild
        >
          <Link href="/docs" target="_blank" rel="noreferrer">
            <BookMarked />
          </Link>
        </IconButton>

        <Visibility isVisible={isExpanded}>
          <Menu.Root>
            <Menu.Trigger colorPalette="blue" asChild>
              <IconButton size="2xs" variant="ghost" title="Social Links">
                <Globe />
              </IconButton>
            </Menu.Trigger>
            <Portal>
              <Menu.Positioner>
                <Menu.Content>
                  {SOCIAL_LINKS.map(({ label, href, color }) => (
                    <Menu.Item
                      value={label}
                      key={label}
                      _highlighted={{
                        color: `${color}.700`,
                        backgroundColor: `${color}.100`,
                      }}
                      _hover={{ cursor: 'pointer' }}
                      asChild
                    >
                      <Link
                        href={'https://' + href}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {label}
                      </Link>
                    </Menu.Item>
                  ))}
                </Menu.Content>
              </Menu.Positioner>
            </Portal>
          </Menu.Root>
          <IconButton
            size="2xs"
            variant="ghost"
            colorPalette="green"
            title="Suggestions + feedback + ideas"
            asChild
          >
            <Link
              href="github.com/diosvo/team-management/issues/new?title=Feedback%20for%20%E2%80%9CTeam%20Rule%E2%80%9D&labels=maintenance&project=team-management&assignees=diosvo"
              target="_blank"
              rel="noreferrer"
            >
              <Flag />
            </Link>
          </IconButton>
        </Visibility>
      </HStack>
    </VStack>
  );
}
