import { EmailStatus } from '../enum';
import type { Selection } from '../type';
import { ALL } from './app';

export const SELECTABLE_EMAIL_STATUS = [
  EmailStatus.BOUNCED,
  EmailStatus.CANCELED,
  EmailStatus.CLICKED,
  EmailStatus.COMPLAINED,
  EmailStatus.DELIVERED,
  EmailStatus.DELIVERY_DELAYED,
  EmailStatus.FAILED,
  EmailStatus.OPENED,
  EmailStatus.QUEUED,
  EmailStatus.SCHEDULED,
  EmailStatus.SENT,
  EmailStatus.SUPPRESSED,
] as const;
export const EMAIL_STATUS_SELECTION: Selection<string> = [
  { label: 'Bounced', value: EmailStatus.BOUNCED },
  { label: 'Canceled', value: EmailStatus.CANCELED },
  { label: 'Clicked', value: EmailStatus.CLICKED },
  { label: 'Complained', value: EmailStatus.COMPLAINED },
  { label: 'Delivered', value: EmailStatus.DELIVERED },
  { label: 'Delivery Delayed', value: EmailStatus.DELIVERY_DELAYED },
  { label: 'Failed', value: EmailStatus.FAILED },
  { label: 'Opened', value: EmailStatus.OPENED },
  { label: 'Queued', value: EmailStatus.QUEUED },
  { label: 'Scheduled', value: EmailStatus.SCHEDULED },
  { label: 'Sent', value: EmailStatus.SENT },
  { label: 'Suppressed', value: EmailStatus.SUPPRESSED },
];
export const EMAIL_STATUS_VALUES = [ALL.value, ...SELECTABLE_EMAIL_STATUS];
