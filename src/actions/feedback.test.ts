import { buildIssueBody } from '@/lib/feedback';
import { createIssue } from '@/lib/github';
import { SubmitFeedbackSchema } from '@/schemas/feedback';

import { mockWithAuth } from '@/test/mocks/auth';
import { MOCK_USER } from '@/test/mocks/user';

import { submitFeedback } from './feedback';

vi.mock('./auth', () => ({ withAuth: mockWithAuth }));

vi.mock('@env', () => ({ default: { NODE_ENV: 'production' } }));

vi.mock('@/lib/github', () => ({ createIssue: vi.fn() }));

vi.mock('@/lib/feedback', () => ({
  buildIssueBody: vi.fn(() => 'issue body'),
}));

const VALUES = {
  type: 'bug' as const,
  title: 'Attendance export is empty',
  description: 'It is empty',
  page: '/attendance',
};

describe('submitFeedback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('files the issue with the type labels and credits the user', async () => {
    vi.mocked(createIssue).mockResolvedValue({
      number: 42,
      url: 'https://github.com/diosvo/team-management/issues/42',
    });

    const result = await submitFeedback(VALUES);

    expect(buildIssueBody).toHaveBeenCalledWith({
      description: VALUES.description,
      type: 'Bug',
      page: VALUES.page,
      author: `${MOCK_USER.name} (${MOCK_USER.email})`,
    });
    expect(createIssue).toHaveBeenCalledWith({
      title: VALUES.title,
      body: 'issue body',
      labels: ['bugfix'],
      assignees: ['diosvo'],
    });
    expect(result).toEqual({
      success: true,
      message: 'Thanks! Your feedback was filed as #42.',
      data: {
        number: 42,
        url: 'https://github.com/diosvo/team-management/issues/42',
      },
    });
  });

  test('rejects invalid input without calling GitHub', async () => {
    const result = await submitFeedback({ ...VALUES, title: 'Hi' });

    expect(result).toEqual({
      success: false,
      message: 'Be at least 5 characters long.',
    });
    expect(createIssue).not.toHaveBeenCalled();
  });

  test('falls back to the raw message when it is not a translation key', async () => {
    const result = await submitFeedback({
      ...VALUES,
      page: 'not-a-path',
    });

    expect(result.success).toBe(false);
    expect(createIssue).not.toHaveBeenCalled();
  });

  test('translates the message when the schema reports a validation key', async () => {
    // Every real failure here localizes to a final string already, so a
    // spy is the only way to exercise this (defensive) translation-key path.
    const safeParseSpy = vi
      .spyOn(SubmitFeedbackSchema, 'safeParse')
      .mockReturnValue({
        success: false,
        error: { issues: [{ message: 'required' }] },
      } as never);

    const result = await submitFeedback(VALUES);

    expect(result).toEqual({
      success: false,
      message: 'This field is required.',
    });
    expect(createIssue).not.toHaveBeenCalled();

    safeParseSpy.mockRestore();
  });

  test('hides the GitHub error from the reporter', async () => {
    vi.mocked(createIssue).mockRejectedValue(
      new Error('GITHUB_TOKEN is not configured'),
    );

    const result = await submitFeedback(VALUES);

    expect(result).toEqual({
      success: false,
      message:
        'Unable to send your feedback right now. Please try again later.',
    });
  });

  test('surfaces the raw error message in development', async () => {
    vi.doMock('@env', () => ({ default: { NODE_ENV: 'development' } }));
    vi.resetModules();
    const { submitFeedback: submitFeedbackDev } = await import('./feedback');
    const { createIssue: createIssueDev } = await import('@/lib/github');
    vi.mocked(createIssueDev).mockRejectedValue(
      new Error('GITHUB_TOKEN is not configured'),
    );

    const result = await submitFeedbackDev(VALUES);

    expect(result).toEqual({
      success: false,
      message: 'GITHUB_TOKEN is not configured',
    });

    vi.doUnmock('@env');
    vi.resetModules();
  });
});
