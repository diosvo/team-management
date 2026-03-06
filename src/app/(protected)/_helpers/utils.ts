import {
  BadgeCheck,
  ChartArea,
  DatabaseZap,
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

export const hrefPath = (text: string): string => {
  return '/' + text.toLowerCase().replace(/\s+/g, '-');
};

// Implement sidebar with specific role
// disabled = true when the feature is not implemented yet

export const SIDEBAR_GROUP = [
  {
    title: 'Overview',
    items: [
      {
        icon: LayoutDashboard,
        text: 'Dashboard',
        active: true,
        disabled: false,
      },
      // Move to Dashboard later
      { icon: ChartArea, text: 'Analytics', disabled: false },
      {
        icon: ShieldCheck,
        text: 'Team Rule',
        disabled: false,
      },
    ],
  },
  {
    title: 'Team Management',
    items: [
      { icon: UsersRound, text: 'Roster', disabled: false },
      { icon: Dumbbell, text: 'Training', disabled: false },
      { icon: BadgeCheck, text: 'Attendance', disabled: false },
      { icon: FileText, text: 'Registration', disabled: false },
      { icon: GamepadDirectional, text: 'Matches', disabled: false },
    ],
  },
  {
    title: 'Performance',
    items: [
      {
        icon: FileChartColumnIncreasing,
        text: 'Periodic Testing',
        disabled: false,
      },
    ],
  },
  {
    title: 'Resources',
    items: [
      {
        icon: Package,
        text: 'Assets',
        disabled: false,
      },
      {
        icon: Film,
        text: 'Documents',
        disabled: true,
      },
      {
        icon: DatabaseZap,
        text: 'Cache Store',
        disabled: false,
      },
    ],
  },
  {
    title: 'Settings',
    items: [
      {
        icon: Trophy,
        text: 'Leagues',
        disabled: false,
      },
      {
        icon: MapPinHouse,
        text: 'Locations',
        disabled: false,
      },
    ],
  },
];
