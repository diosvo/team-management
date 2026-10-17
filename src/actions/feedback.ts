'use server';

import { getTranslations } from 'next-intl/server';
import env from '@env';

import { buildIssueBody } from '@/lib/feedback';
import { createIssue } from '@/lib/github';
import {
  SubmitFeedbackSchema,
  type SubmitFeedbackSchemaValues,
} from '@/schemas/feedback';
import { FEEDBACK_ASSIGNEES, FEEDBACK_TYPES } from '@/utils/constants/feedback';
import { localizeIssue } from '@/i18n/zod';
import { ResponseFactory } from '@/utils/response';

import { withAuth } from './auth';

/**
 * Files the feedback with the app's own token, for reporters without a
 * GitHub account. The signed-in user is credited in the issue body.
 */
export const submitFeedback = withAuth(
  async (user, values: SubmitFeedbackSchemaValues) => {
    const [t, tValidation] = await Promise.all([
      getTranslations('actions.feedback'),
      getTranslations('validation'),
    ]);
    const parsed = SubmitFeedbackSchema.safeParse(values, {
      error: (issue) => localizeIssue(issue, tValidation),
    });

    if (!parsed.success) {
      // Schema-specific messages are `validation` keys
      const { message } = parsed.error.issues[0];
      return ResponseFactory.error(
        tValidation.has(message as never)
          ? tValidation(message as never)
          : message,
      );
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
        t('submitted', { number: issue.number }),
        issue,
      );
    } catch (error) {
      return ResponseFactory.error(
        env.NODE_ENV === 'development' ? (error as Error).message : t('failed'),
      );
    }
  },
);
