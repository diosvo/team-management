import env from '@env';

import { createIssue } from './github';

vi.mock('@env', () => ({ default: { GITHUB_TOKEN: 'gh-token' } }));

const ISSUE = { title: 'Broken export', body: '<p>Details</p>' };

describe('createIssue', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    env.GITHUB_TOKEN = 'gh-token';
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test('posts the issue to the configured repository', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        number: 42,
        html_url: 'https://github.com/diosvo/team-management/issues/42',
      }),
    });

    const issue = await createIssue({ ...ISSUE, labels: ['maintenance'] });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.github.com/repos/diosvo/team-management/issues',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer gh-token',
          Accept: 'application/vnd.github+json',
        }),
        body: JSON.stringify({ ...ISSUE, labels: ['maintenance'] }),
      }),
    );
    expect(issue).toEqual({
      number: 42,
      url: 'https://github.com/diosvo/team-management/issues/42',
    });
  });

  test('assigns the issue when assignees are given', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ number: 43, html_url: 'https://example.com/43' }),
    });

    await createIssue({ ...ISSUE, assignees: ['diosvo'] });

    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
      ...ISSUE,
      assignees: ['diosvo'],
    });
  });

  test('leaves assignees out of the payload when there are none', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ number: 44, html_url: 'https://example.com/44' }),
    });

    await createIssue({ ...ISSUE, assignees: [] });

    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).not.toHaveProperty(
      'assignees',
    );
  });

  test('throws before calling GitHub when no token is configured', async () => {
    env.GITHUB_TOKEN = '';

    await expect(createIssue(ISSUE)).rejects.toThrow(
      'GITHUB_TOKEN is not configured',
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('throws with the status and detail when GitHub rejects the issue', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 422,
      text: async () => 'Validation Failed',
    });

    await expect(createIssue(ISSUE)).rejects.toThrow(
      'GitHub rejected the issue (422): Validation Failed',
    );
  });
});
