import type { ColorPalette } from '@chakra-ui/react';
import { formatDistanceToNow } from 'date-fns';
import {
  BadgeCheck,
  ChartColumn,
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
} from 'lucide-react';

import { ESTABLISHED_DATE } from '@/utils/constants';
import type { Resource } from '@/utils/permissions';

type SidebarGroup = {
  title: string;
  items: Array<{
    icon: typeof LayoutDashboard;
    resource: Resource;
    disabled?: boolean;
  }>;
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
      { icon: ChartColumn, resource: 'reports' },
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
  {
    label: 'Facebook',
    href: 'facebook.com/' + TEAM_ID,
    color: 'blue',
  },
  {
    label: 'Instagram',
    href: 'instagram.com/' + TEAM_ID,
    color: 'pink',
  },
  {
    label: 'TikTok',
    href: 'tiktok.com/@' + TEAM_ID,
    color: 'gray',
  },
];

// Static config - hoisted so no object identity churn between renders
export const BUTTON_CONFIG = {
  size: { base: 'xs', md: 'sm', mdTo2xl: 'md' },
  color: 'gray.700',
  _hover: { _icon: { animation: 'wiggle 1s linear infinite' } },
} as const;

// Scrollbar fades in only while actively scrolling (driven by the
// data-scrolling attribute on the root).
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

// Smooth animations for sidebar expand/collapse and toggle button
export const SIDEBAR_CSS = {
  transition: 'all 0.3s ease',
} as const;

// Toggle button also hides opacity while scrolling
export const TOGGLE_CSS = {
  ...SIDEBAR_CSS,
  '[data-scrolling] &': { opacity: 0, pointerEvents: 'none' },
} as const;
