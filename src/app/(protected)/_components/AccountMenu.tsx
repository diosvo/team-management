'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import {
  Avatar,
  Link as ChakraLink,
  Circle,
  type ColorPalette,
  Float,
  Menu,
  Portal,
  SkeletonCircle,
  Span,
  Switch,
  Text,
} from '@chakra-ui/react';
import {
  BookMarked,
  ChevronRight,
  GamepadDirectional,
  Globe,
  Languages,
  LogOut,
  MessageSquareHeart,
  UserRound,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

import { setLocale } from '@/actions/locale';
import { useUserAvatar } from '@/hooks/use-image';
import authClient from '@/lib/auth-client';
import { useSessionContext } from '@/providers/session';
import { LOGIN_PATH } from '@/routes';

import { TEAM_ID } from '@/utils/constants';
import { getColor } from '@/utils/helper';

import FeedbackDialog from './FeedbackDialog';

export const SOCIAL_LINKS: Array<{
  label: string;
  href: string;
  color: ColorPalette;
}> = [
  { label: 'Facebook', href: `facebook.com/${TEAM_ID}`, color: 'blue' },
  { label: 'Instagram', href: `instagram.com/${TEAM_ID}`, color: 'pink' },
  { label: 'TikTok', href: `tiktok.com/@${TEAM_ID}`, color: 'gray' },
];
const ITEM_PROPS = { _hover: { cursor: 'pointer' } } as const;

export default function AccountMenu() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('shell.accountMenu');
  const [, startTransition] = useTransition();
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const { user, isAuthenticated } = useSessionContext();

  const { data: image, isLoading } = useUserAvatar(user?.image);

  if (!isAuthenticated || !user) return null;

  async function handleLogout() {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => router.replace(LOGIN_PATH),
      },
    });
  }

  // Off is English, the default.
  function toggleVietnamese(checked: boolean) {
    startTransition(async () => {
      await setLocale(checked ? 'vi' : 'en');
      router.refresh();
    });
  }

  const Contents = [
    {
      title: t('profile'),
      icon: UserRound,
      href: '/profile',
    },
    {
      title: t('performance'),
      icon: GamepadDirectional,
      href: '/performance',
    },
  ];

  return (
    <>
      <Menu.Root>
        <Menu.Trigger aria-label={t('trigger')} borderRadius="full">
          {isLoading ? (
            <SkeletonCircle size="10" />
          ) : (
            <Avatar.Root
              variant="outline"
              size={{ base: 'xs', md: 'sm', lg: 'md' }}
            >
              <Avatar.Fallback name={user.name} />
              <Avatar.Image src={image ?? undefined} />
              <Float placement="bottom-end" offsetX={1} offsetY={1}>
                <Circle
                  size={2}
                  outline="0.2em solid"
                  outlineColor="bg"
                  backgroundColor={getColor(user.state)}
                />
              </Float>
            </Avatar.Root>
          )}
        </Menu.Trigger>
        <Portal>
          <Menu.Positioner>
            <Menu.Content minWidth="60">
              <Menu.ItemGroup>
                <Menu.ItemGroupLabel>
                  <Text fontWeight="semibold" truncate>
                    {user.name}
                  </Text>
                  <Text textStyle="xs" color="fg.muted" truncate>
                    {user.email}
                  </Text>
                </Menu.ItemGroupLabel>
              </Menu.ItemGroup>
              <Menu.Separator />
              {Contents.map(({ title, icon: Icon, href }) => (
                <Menu.Item key={href} value={href} {...ITEM_PROPS} asChild>
                  <Link href={href + '/' + user.id}>
                    <Icon size={14} />
                    {title}
                  </Link>
                </Menu.Item>
              ))}
              <Menu.Separator />
              <Menu.CheckboxItem
                value="vietnamese"
                checked={locale === 'vi'}
                closeOnSelect={false}
                onCheckedChange={toggleVietnamese}
                css={{ '&[data-type]': { ps: '2' } }}
                {...ITEM_PROPS}
              >
                <Languages size={14} />
                <Menu.ItemText flex="1">{t('vietnamese')}</Menu.ItemText>
                {/* Visual only: the menu item carries the checked state. */}
                <Switch.Root
                  size="sm"
                  checked={locale === 'vi'}
                  pointerEvents="none"
                  aria-hidden
                >
                  <Switch.Control>
                    <Switch.Thumb />
                  </Switch.Control>
                </Switch.Root>
              </Menu.CheckboxItem>
              <Menu.Separator />
              <Menu.Item value="docs" {...ITEM_PROPS} asChild>
                <ChakraLink
                  href="/docs"
                  target="_blank"
                  rel="noopener noreferrer"
                  textDecoration="none"
                >
                  <BookMarked size={14} />
                  {t('documentation')}
                </ChakraLink>
              </Menu.Item>
              <Menu.Root positioning={{ placement: 'left-start', gutter: 2 }}>
                <Menu.TriggerItem {...ITEM_PROPS}>
                  <Globe size={14} />
                  <Span flex="1">{t('socialLinks')}</Span>
                  <ChevronRight size={14} />
                </Menu.TriggerItem>
                <Portal>
                  <Menu.Positioner>
                    <Menu.Content>
                      {SOCIAL_LINKS.map(({ label, href, color }) => (
                        <Menu.Item
                          key={label}
                          value={label}
                          {...ITEM_PROPS}
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
                            textDecoration="none"
                          >
                            {label}
                          </ChakraLink>
                        </Menu.Item>
                      ))}
                    </Menu.Content>
                  </Menu.Positioner>
                </Portal>
              </Menu.Root>
              <Menu.Item
                value="feedback"
                {...ITEM_PROPS}
                onClick={() => setFeedbackOpen(true)}
              >
                <MessageSquareHeart size={14} /> {t('feedback')}
              </Menu.Item>
              <Menu.Separator />
              <Menu.Item
                value="logout"
                color="fg.error"
                _highlighted={{ color: 'fg.error', bg: 'bg.error' }}
                {...ITEM_PROPS}
                onClick={handleLogout}
              >
                <LogOut size={14} /> {t('logout')}
              </Menu.Item>
            </Menu.Content>
          </Menu.Positioner>
        </Portal>
      </Menu.Root>
      <FeedbackDialog open={feedbackOpen} onOpenChange={setFeedbackOpen} />
    </>
  );
}
