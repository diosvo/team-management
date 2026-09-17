import type { ColorPalette } from '@chakra-ui/react';
import { formatDistanceToNow } from 'date-fns';
import {
  BadgeCheck,
  Dumbbell,
  FileText,
  Film,
  GamepadDirectional,
  LayoutDashboard,
  MailSearch,
  MapPinHouse,
  Medal,
  Package,
  PersonStanding,
  ShieldCheck,
  Swords,
  Trophy,
  UsersRound,
  type LucideIcon,
} from 'lucide-react';

import { ESTABLISHED_DATE } from '@/utils/constants';
import type { Resource } from '@/utils/permissions';

type SidebarGroup = {
  title: string;
  items: Array<{ icon: LucideIcon; resource: Resource; disabled?: boolean }>;
};

const TEAM_ID = 'saigon.rovers';
export const getYearsActive = formatDistanceToNow(new Date(ESTABLISHED_DATE));

/** Convert a kebab-case URL segment or resource key into a Title Case label */
export function segmentToLabel(segment: string): string {
  return segment
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export const SIDEBAR_GROUP: Array<SidebarGroup> = [
  {
    title: 'Overview',
    items: [
      { icon: LayoutDashboard, resource: 'dashboard' },
      { icon: Medal, resource: 'achievements' },
      { icon: ShieldCheck, resource: 'team-rule' },
    ],
  },
  {
    title: 'Team Management',
    items: [
      { icon: UsersRound, resource: 'roster' },
      { icon: Dumbbell, resource: 'training' },
      { icon: BadgeCheck, resource: 'attendance' },
      { icon: FileText, resource: 'registration' },
      { icon: GamepadDirectional, resource: 'matches' },
    ],
  },
  {
    title: 'Performance',
    items: [{ icon: PersonStanding, resource: 'periodic-testing' }],
  },
  {
    title: 'Resources',
    items: [
      { icon: Package, resource: 'assets' },
      { icon: Film, resource: 'documents', disabled: true },
      { icon: MailSearch, resource: 'emails' },
    ],
  },
  {
    title: 'Settings',
    items: [
      { icon: Swords, resource: 'teams' },
      { icon: Trophy, resource: 'leagues' },
      { icon: MapPinHouse, resource: 'locations' },
    ],
  },
];

export const SOCIAL_LINKS: Array<{
  label: string;
  href: string;
  color: ColorPalette;
}> = [
  { label: 'Facebook', href: `facebook.com/${TEAM_ID}`, color: 'blue' },
  { label: 'Instagram', href: `instagram.com/${TEAM_ID}`, color: 'pink' },
  { label: 'TikTok', href: `tiktok.com/@${TEAM_ID}`, color: 'gray' },
];

// Hoisted so the memoized NavButton keeps a stable prop identity.
export const BUTTON_CONFIG = {
  size: { base: 'xs', md: 'sm', mdTo2xl: 'md' },
  color: 'gray.700',
  _hover: { _icon: { animation: 'wiggle 1s linear infinite' } },
} as const;

/** Left inset shared by nav icons and group titles so they line up. */
export const NAV_INSET = 4;

/** Rail width animation; `AppShell` uses the same values for its grid column. */
export const SIDEBAR_DURATION = '0.3s';
export const SIDEBAR_EASING = 'cubic-bezier(0.4, 0, 0.2, 1)';
export const SIDEBAR_TRANSITION = `${SIDEBAR_DURATION} ${SIDEBAR_EASING}`;

export const REDUCED_MOTION_CSS = {
  '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
} as const;

/** Cross-fade for labels, titles and separators when the rail toggles. */
export const FADE_CSS = {
  transition: `opacity 0.2s ${SIDEBAR_EASING}`,
  ...REDUCED_MOTION_CSS,
} as const;

/** Thin scrollbar, visible only while scrolling. */
export const SCROLL_AREA_CSS = {
  scrollbarWidth: 'thin',
  scrollbarColor: 'transparent transparent',
  '&::-webkit-scrollbar': { width: '6px' },
  '&::-webkit-scrollbar-thumb': {
    borderRadius: '3px',
    backgroundColor: 'transparent',
    transition: 'background-color 0.2s ease',
  },
  '[data-scrolling] &': {
    scrollbarColor: 'var(--chakra-colors-gray-300) transparent',
    '&::-webkit-scrollbar-thumb': {
      backgroundColor: 'var(--chakra-colors-gray-300)',
    },
  },
} as const;

/** Toggle fades out while scrolling. */
export const TOGGLE_CSS = {
  transition: `opacity 0.2s ${SIDEBAR_EASING}`,
  '[data-scrolling] &': { opacity: 0, pointerEvents: 'none' },
  ...REDUCED_MOTION_CSS,
} as const;
