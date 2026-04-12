import {
  BadgeCheck,
  Dumbbell,
  FileChartColumnIncreasing,
  FileText,
  Film,
  GamepadDirectional,
  LayoutDashboard,
  MapPinHouse,
  Package,
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
    items: [{ icon: FileChartColumnIncreasing, resource: 'periodic-testing' }],
  },
  {
    title: 'Resources',
    items: [
      { icon: Package, resource: 'assets' },
      { icon: Film, resource: 'documents' },
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
