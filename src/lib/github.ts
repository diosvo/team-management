import env from '@env';

import { FEEDBACK_REPOSITORY } from '@/utils/constants/feedback';

const GITHUB_API_URL = 'https://api.github.com';

type CreateIssueInput = {
  title: string;
  body: string;
  labels?: Array<string>;
  /** GitHub logins; each needs access to the repository. */
  assignees?: Array<string>;
};

export type CreatedIssue = {
  number: number;
  url: string;
};

/**
 * @description Opens an issue on `FEEDBACK_REPOSITORY` with the app's own
 * token, so reporters do not need a GitHub account of their own.
 * @link https://docs.github.com/en/rest/issues/issues#create-an-issue
 */
export async function createIssue({
  title,
  body,
  labels,
  assignees,
}: CreateIssueInput): Promise<CreatedIssue> {
  if (!env.GITHUB_TOKEN) {
    throw new Error('GITHUB_TOKEN is not configured');
  }

  const response = await fetch(
    `${GITHUB_API_URL}/repos/${FEEDBACK_REPOSITORY}/issues`,
    {
      method: 'POST',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${env.GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: JSON.stringify({
        title,
        body,
        labels,
        ...(assignees?.length && { assignees }),
      }),
    },
  );

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(
      `GitHub rejected the issue (${response.status}): ${detail.slice(0, 256)}`,
    );
  }

  const issue = await response.json();

  return { number: issue.number, url: issue.html_url };
}
