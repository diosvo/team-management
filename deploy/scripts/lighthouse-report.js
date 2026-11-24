// Writes the Lighthouse scores to the job summary and upserts them as a
// comment on the pull request.
// Called by .github/workflows/lighthouse.yaml via actions/github-script.
//
// • ASSERT_RESULT: outcome of the `lhci assert` step
// • MARKER: Hidden comment identifier
// • MANIFEST: manifest.json from `lhci upload --target=filesystem`
// • LINKS: links.json from `lhci upload --target=temporary-public-storage`
const fs = require('node:fs');

const CATEGORIES = [
  ['performance', 'Performance'],
  ['accessibility', 'Accessibility'],
  ['best-practices', 'Best practices'],
  ['seo', 'SEO'],
];

const readJson = (file, fallback, core) => {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (err) {
    core.warning(`Could not read ${file}: ${err.message}`);
    return fallback;
  }
};

const score = (value) => {
  if (typeof value !== 'number') return '–';
  const points = Math.round(value * 100);
  const icon = points >= 90 ? '🟢' : points >= 50 ? '🟠' : '🔴';
  return `${icon} ${points}`;
};

module.exports = async ({ github, context, core }) => {
  const { ASSERT_RESULT, MARKER, MANIFEST, LINKS } = process.env;

  // One run per URL: the median run lhci marks as representative.
  const runs = readJson(MANIFEST, [], core).filter(
    (run) => run.isRepresentativeRun,
  );
  const links = readJson(LINKS, {}, core);

  const rows = runs.map((run) => {
    const path = new URL(run.url).pathname;
    const report = links[run.url] ? `[Report](${links[run.url]})` : '–';
    const scores = CATEGORIES.map(([key]) => score(run.summary[key]));
    return `| \`${path}\` | ${scores.join(' | ')} | ${report} |`;
  });

  const passed = ASSERT_RESULT === 'success';
  const body = [
    MARKER,
    `## 🔦 Lighthouse ${passed ? '✅' : '❌'}`,
    '',
    runs.length
      ? [
          `| Page | ${CATEGORIES.map(([, label]) => label).join(' | ')} | |`,
          `| --- | ${CATEGORIES.map(() => '---').join(' | ')} | --- |`,
          ...rows,
        ].join('\n')
      : '⚠️ No Lighthouse results found.',
    '',
    passed
      ? 'Median of 3 runs per page, production build on the CI runner.'
      : 'Below the budget in `.github/lighthouserc.json`: see the **Assert budgets** step.',
    'Report links expire after about 7 days; the `lighthouse-report` artifact keeps the HTML.',
  ].join('\n');

  await core.summary.addRaw(body).write();

  // Only pull requests get a comment; manual runs stop at the job summary.
  if (!context.issue.number) return;

  const issue = {
    owner: context.repo.owner,
    repo: context.repo.repo,
    issue_number: context.issue.number,
  };
  const comments = await github.paginate(github.rest.issues.listComments, {
    ...issue,
    per_page: 100,
  });
  const existing = comments.find(
    (c) => c.user?.type === 'Bot' && c.body?.includes(MARKER),
  );

  if (existing) {
    await github.rest.issues.updateComment({
      ...issue,
      comment_id: existing.id,
      body,
    });
  } else {
    await github.rest.issues.createComment({ ...issue, body });
  }
};
