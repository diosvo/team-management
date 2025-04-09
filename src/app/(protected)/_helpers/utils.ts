import {
  BadgeCheck,
  CalendarDays,
  ChartArea,
  FileText,
  Home,
  UserCheck,
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
      { icon: ChartArea, text: 'Team Analytics', disabled: true },
    ],
  },
  {
    title: 'Team Management',
    items: [
      { icon: Users, text: 'Roster', disabled: true },
      { icon: CalendarDays, text: 'Schedule', disabled: true },
      { icon: BadgeCheck, text: 'Attendance', disabled: true },
      { icon: FileText, text: 'Registration', disabled: true },
    ],
  },
  {
    title: 'Administration',
    items: [{ icon: UserCheck, text: 'User Management', disabled: false }],
  },
];
