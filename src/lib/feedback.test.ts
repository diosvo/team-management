import { buildIssueBody } from './feedback';

describe('buildIssueBody', () => {
  const submittedAt = new Date('2026-08-28T10:00:00.000Z');
  const author = 'Nhung Vo (nhung@example.com)';

  test('leads with the metadata bullets, then the description', () => {
    const body = buildIssueBody({
      description: '  **Broken** export  ',
      type: 'Bug',
      page: '/roster',
      author,
      submittedAt,
    });

    expect(body.split('\n\n')).toEqual([
      [
        '- **Type:** Bug',
        '- **Page:** `/roster`',
        `- **Submitted by:** ${author}`,
        '- **Submitted at:** 2026-08-28T10:00:00.000Z',
      ].join('\n'),
      '---',
      '**Broken** export',
      '<sub>Sent from the in-app feedback form.</sub>',
    ]);
  });

  test('notes when the page is not shared', () => {
    const body = buildIssueBody({ description: 'Broken', author, submittedAt });

    expect(body).not.toContain('- **Type:**');
    expect(body).toContain('- **Page:** Not shared');
  });
});
