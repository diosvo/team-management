import type { useTranslations } from 'next-intl';
import type { z } from 'zod';

type ValidationTranslator = ReturnType<typeof useTranslations<'validation'>>;

/**
 * Localized message for a generic zod issue (length, range, format, required),
 * or `undefined` to keep zod's own. Schema-specific messages are `validation`
 * keys translated by `<Field />`.
 */
export function localizeIssue(
  issue: z.core.$ZodRawIssue,
  t: ValidationTranslator,
): string | undefined {
  const { code, origin } = issue;
  const isString = origin === 'string';
  const isArray = origin === 'array' || origin === 'set';

  if (code === 'too_small' || code === 'too_big') {
    const bound = Number(code === 'too_small' ? issue.minimum : issue.maximum);
    if (isString && issue.exact) return t('exactDigits', { length: bound });
    if (isString && code === 'too_small' && bound === 1) return t('required');
    if (isString) {
      return code === 'too_small'
        ? t('minLength', { min: bound })
        : t('maxLength', { max: bound });
    }
    if (isArray) {
      return code === 'too_small'
        ? t('minItems', { min: bound })
        : t('maxItems', { max: bound });
    }
    return code === 'too_small'
      ? t('minValue', { min: bound })
      : t('maxValue', { max: bound });
  }
  if (code === 'invalid_format' && issue.format === 'email') return t('email');
  if (issue.input === undefined || issue.input === null) return t('required');
  return undefined;
}
