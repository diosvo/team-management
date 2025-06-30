import {
  BadgeCheck,
  CalendarDays,
  Crown,
  Dumbbell,
  FileChartColumnIncreasing,
  FileText,
  Film,
  Home,
  Package,
  Users,
} from 'lucide-react';

export const hrefPath = (text: string): string => {
  return '/' + text.toLowerCase().replace(/\s+/g, '-');
};

// disabled = true when the feature is not implemented yet

export const SIDEBAR_GROUP = [
  {
    title: 'Overview',
    items: [
      { icon: Home, text: 'Dashboard', active: true, disabled: false },
      { icon: Dumbbell, text: 'Training', disabled: true },
    ],
  },
  {
    title: 'Team Management',
    items: [
      { icon: Users, text: 'Roster', disabled: false },
      { icon: CalendarDays, text: 'Schedule', disabled: true },
      { icon: BadgeCheck, text: 'Attendance', disabled: true },
      { icon: FileText, text: 'Registration', disabled: false },
    ],
  },
  {
    title: 'Performance',
    items: [
      {
        icon: FileChartColumnIncreasing,
        text: 'Bi-monthly Testing',
        disabled: true,
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
    ],
  },
  {
    title: '',
    items: [
      {
        icon: Crown,
        text: 'Team Rule',
        disabled: false,
      },
    ],
  },
];
