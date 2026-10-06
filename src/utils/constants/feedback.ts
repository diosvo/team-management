/** The `owner/repo` that receives in-app feedback as issues. */
export const FEEDBACK_REPOSITORY = 'diosvo/team-management';

export const FEEDBACK_TYPE_KEYS = ['bug', 'feature', 'other'] as const;
export type FeedbackType = (typeof FEEDBACK_TYPE_KEYS)[number];

/** Labels applied to the issue filed for each feedback type. */
export const FEEDBACK_TYPES: Record<
  FeedbackType,
  { label: string; description: string; labels: string[] }
> = {
  bug: {
    label: 'Bug',
    description: 'Something is broken or behaves unexpectedly.',
    labels: ['bugfix'],
  },
  feature: {
    label: 'Feature',
    description: 'A new capability or an improvement to an existing one.',
    labels: ['feature'],
  },
  other: {
    label: 'Other',
    description: 'A question, a typo, or anything else.',
    labels: ['maintenance'],
  },
};

/** GitHub logins assigned to every feedback issue. */
export const FEEDBACK_ASSIGNEES = ['diosvo'];

export const FEEDBACK_TITLE_LIMIT = 128;
export const FEEDBACK_DESCRIPTION_LIMIT = 1000;
