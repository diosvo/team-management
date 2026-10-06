'use server';

import env from '@env';

import { buildIssueBody } from '@/lib/feedback';
import { createIssue } from '@/lib/github';
import {
  SubmitFeedbackSchema,
  type SubmitFeedbackSchemaValues,
} from '@/schemas/feedback';
import { FEEDBACK_ASSIGNEES, FEEDBACK_TYPES } from '@/utils/constants/feedback';
import { ResponseFactory } from '@/utils/response';

import { withAuth } from './auth';

/**
 * Files the feedback with the app's own token, for reporters without a
 * GitHub account. The signed-in user is credited in the issue body.
 */
export const submitFeedback = withAuth(
  async (user, values: SubmitFeedbackSchemaValues) => {
    const parsed = SubmitFeedbackSchema.safeParse(values);

    if (!parsed.success) {
      return ResponseFactory.error(parsed.error.issues[0].message);
    }

    const { type, title, description, page } = parsed.data;
    const { label, labels } = FEEDBACK_TYPES[type];

    try {
      const issue = await createIssue({
        title,
        body: buildIssueBody({
          description,
          type: label,
          page,
          author: `${user.name} (${user.email})`,
        }),
        labels,
        assignees: FEEDBACK_ASSIGNEES,
      });

      return ResponseFactory.success(
        `Thanks! Your feedback was filed as #${issue.number}.`,
        issue,
      );
    } catch (error) {
      return ResponseFactory.error(
        env.NODE_ENV === 'development'
          ? (error as Error).message
          : 'Unable to send your feedback right now. Please try again later.',
      );
    }
  },
);
