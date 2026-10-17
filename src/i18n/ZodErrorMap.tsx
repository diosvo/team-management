'use client';

import { useTranslations } from 'next-intl';
import { z } from 'zod';

import { localizeIssue } from './zod';

/** Localizes generic zod issues for client-side form validation. */
export default function ZodErrorMap() {
  const t = useTranslations('validation');

  z.config({ customError: (issue) => localizeIssue(issue, t) });

  return null;
}
