import { AttendanceStatus } from '../enum';
import type { Selection } from '../type';
import { ALL } from './app';

export const SELECTABLE_ATTENDANCE_STATUS = [
  AttendanceStatus.ON_TIME,
  AttendanceStatus.LATE,
  AttendanceStatus.ABSENT,
] as const;
export const ATTENDANCE_STATUS_SELECTION: Selection<string> = [
  {
    label: 'On Time',
    value: AttendanceStatus.ON_TIME,
  },
  {
    label: 'Late',
    value: AttendanceStatus.LATE,
  },
  {
    label: 'Absent',
    value: AttendanceStatus.ABSENT,
  },
];
export const ATTENDANCE_STATUS_VALUES = [
  ALL.value,
  ...SELECTABLE_ATTENDANCE_STATUS,
];
