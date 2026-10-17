import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
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
  type LucideIcon,
} from 'lucide-react';
import type { Messages } from 'next-intl';

import type { Locale } from '@/i18n/config';
import { ESTABLISHED_DATE } from '@/utils/constants';
import { toLabel } from '@/utils/formatter';
import type { Resource } from '@/utils/permissions';

export type SidebarGroup = {
  /** Key under `shell.sidebar.groups` */
  title: keyof Messages['shell']['sidebar']['groups'];
  items: Array<{
    icon: LucideIcon;
    resource: Resource;
    disabled?: boolean;
    /** Global search can deep-link into the page list via `?q=`. */
    searchable?: boolean;
  }>;
};

export const getYearsActive = (locale: Locale) =>
  formatDistanceToNow(new Date(ESTABLISHED_DATE), {
    locale: locale === 'vi' ? vi : undefined,
  });

/** Minimal shape of `useTranslations('shell.nav')` */
type NavTranslator = {
  (key: never): string;
  has(key: never): boolean;
};

/**
 * Localized label for a URL segment or resource key via `shell.nav` (keyed by
 * the segment itself), falling back to `toLabel` for unknown segments
 * (_e.g.,_ ids).
 */
export function navLabel(t: NavTranslator, segment: string): string {
  const key = segment as never;
  return t.has(key) ? t(key) : toLabel(segment);
}

export const SIDEBAR_GROUP: Array<SidebarGroup> = [
  {
    title: 'overview',
    items: [
      { icon: LayoutDashboard, resource: 'dashboard' },
      { icon: Medal, resource: 'achievements' },
      { icon: ChartColumn, resource: 'reports' },
      { icon: ShieldCheck, resource: 'team-rule' },
    ],
  },
  {
    title: 'team-management',
    items: [
      { icon: UsersRound, resource: 'roster', searchable: true },
      { icon: Dumbbell, resource: 'training', searchable: true },
      { icon: BadgeCheck, resource: 'attendance', searchable: true },
      { icon: FileText, resource: 'registration', searchable: true },
      { icon: GamepadDirectional, resource: 'matches', searchable: true },
    ],
  },
  {
    title: 'performance',
    items: [
      { icon: PersonStanding, resource: 'periodic-testing', searchable: true },
    ],
  },
  {
    title: 'resources',
    items: [
      { icon: Package, resource: 'assets', searchable: true },
      { icon: Film, resource: 'documents', disabled: true },
      { icon: MailSearch, resource: 'emails', searchable: true },
    ],
  },
  {
    title: 'settings',
    items: [
      { icon: Swords, resource: 'teams', searchable: true },
      { icon: Trophy, resource: 'leagues', searchable: true },
      { icon: MapPinHouse, resource: 'locations', searchable: true },
    ],
  },
];

// Hoisted so the memoized NavButton keeps a stable prop identity.
export const BUTTON_CONFIG = {
  // `sm` on phones keeps labels above the 12px group titles.
  size: { base: 'sm', mdTo2xl: 'md' },
  color: 'gray.700',
  _hover: { _icon: { animation: 'wiggle 1s linear infinite' } },
  _motionReduce: { _hover: { _icon: { animation: 'none' } } },
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

/** Hide the scrollbar to keep the rail aligned without affecting scroll behavior. */
export const SCROLL_AREA_CSS = {
  scrollbarWidth: 'none',
  '&::-webkit-scrollbar': { display: 'none' },
} as const;

/** Toggle fades out while scrolling. */
export const TOGGLE_CSS = {
  transition: `opacity 0.2s ${SIDEBAR_EASING}`,
  '[data-scrolling] &': { opacity: 0, pointerEvents: 'none' },
  ...REDUCED_MOTION_CSS,
} as const;
