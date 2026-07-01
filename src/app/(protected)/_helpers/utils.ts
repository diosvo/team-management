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
      { icon: Trophy, resource: 'leagues' },
      { icon: MapPinHouse, resource: 'locations' },
    ],
  },
];
