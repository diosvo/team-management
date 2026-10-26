import { z } from 'zod';

import {
  FEEDBACK_DESCRIPTION_LIMIT,
  FEEDBACK_TITLE_LIMIT,
  FEEDBACK_TYPE_KEYS,
} from '@/utils/constants/feedback';

export const FeedbackFormSchema = z.object({
  type: z.enum(FEEDBACK_TYPE_KEYS),
  title: z.string().trim().min(5).max(FEEDBACK_TITLE_LIMIT),
  description: z
    .string()
    .trim()
    .min(1, { error: 'feedbackDescriptionRequired' })
    .max(FEEDBACK_DESCRIPTION_LIMIT),
});

export type FeedbackFormSchemaValues = z.infer<typeof FeedbackFormSchema>;

export const SubmitFeedbackSchema = FeedbackFormSchema.extend({
  /** Route the feedback was written on; left out when the reporter opts out. */
  page: z.string().startsWith('/').max(256).optional(),
});

export type SubmitFeedbackSchemaValues = z.infer<typeof SubmitFeedbackSchema>;
