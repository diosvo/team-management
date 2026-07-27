import {
  BadgeCheck,
  Dumbbell,
  FileText,
  Film,
  GamepadDirectional,
  LayoutDashboard,
  MailSearch,
  MapPinHouse,
  Package,
  PersonStanding,
  ShieldCheck,
  Swords,
  Trophy,
  UsersRound,
} from 'lucide-react';

import type { Resource } from '@/utils/permissions';

type SidebarGroup = {
  title: string;
  items: Array<{
    icon: typeof LayoutDashboard;
    resource: Resource;
    disabled?: boolean;
  }>;
};

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

// Collapse button hides while scrolling so it never overlaps the scrollbar.
export const TOGGLE_CSS = {
  transition: 'opacity 0.2s ease',
  '[data-scrolling] &': { opacity: 0, pointerEvents: 'none' },
} as const;
