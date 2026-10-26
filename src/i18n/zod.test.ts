import { createTranslator } from 'next-intl';
import { z } from 'zod';

import { MESSAGES } from '@/test/utilities';

import { localizeIssue } from './zod';

const messageOf = (
  schema: z.ZodType,
  input: unknown,
  locale: 'en' | 'vi' = 'en',
) => {
  const t = createTranslator({
    locale,
    messages: MESSAGES[locale],
    namespace: 'validation',
  });
  const result = schema.safeParse(input, {
    error: (issue) => localizeIssue(issue, t),
  });
  return result.success ? undefined : result.error.issues[0].message;
};

describe('localizeIssue', () => {
  test.each([
    ['min length', z.string().min(6), 'abc', 'Be at least 6 characters long.'],
    ['max length', z.string().max(3), 'abcd', 'Be at most 3 characters long.'],
    [
      'exact length',
      z.string().length(10),
      '123',
      'Must contain exactly 10 digits.',
    ],
    ['required string', z.string().min(1), '', 'This field is required.'],
    ['email', z.email(), 'nope', 'Please enter a valid email.'],
    ['min value', z.number().min(1), 0, 'Must be at least 1.'],
    ['max value', z.number().max(99), 100, 'Cannot exceed 99.'],
    [
      'min items',
      z.array(z.string()).min(2),
      ['a'],
      'Select at least 2 items.',
    ],
    [
      'max items',
      z.array(z.string()).max(1),
      ['a', 'b'],
      'Select at most 1 item.',
    ],
    ['missing value', z.string(), undefined, 'This field is required.'],
  ])('localizes %s', (_, schema, input, message) => {
    expect(messageOf(schema, input)).toBe(message);
  });

  test('speaks Vietnamese', () => {
    expect(messageOf(z.string().min(6), 'abc', 'vi')).toBe(
      'Tối thiểu 6 ký tự.',
    );
  });

  test("keeps zod's own message for other issues", () => {
    expect(messageOf(z.enum(['a', 'b']), 'c')).toMatch(/expected one of/i);
  });

  test('never overrides a schema-specific message', () => {
    expect(messageOf(z.string().min(6, { error: 'notInFuture' }), 'a')).toBe(
      'notInFuture',
    );
  });
});
