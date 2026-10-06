type IssueBodyInput = {
  /** Markdown, as typed into the feedback dialog. */
  description: string;
  /** Human-readable kind of feedback, e.g. `Bug`. */
  type?: string;
  page?: string;
  author: string;
  submittedAt?: Date;
};

/** Issue body for feedback filed with the app's token on someone's behalf. */
export function buildIssueBody({
  description,
  type,
  page,
  author,
  submittedAt = new Date(),
}: IssueBodyInput): string {
  return [
    [
      ...(type ? [`- **Type:** ${type}`] : []),
      `- **Page:** ${page ? `\`${page}\`` : 'Not shared'}`,
      `- **Submitted by:** ${author}`,
      `- **Submitted at:** ${submittedAt.toISOString()}`,
    ].join('\n'),
    '---',
    description.trim(),
    '<sub>Sent from the in-app feedback form.</sub>',
  ].join('\n\n');
}
