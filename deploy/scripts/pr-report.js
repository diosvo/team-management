// Upserts the test and audit report comment on a pull request.
// Called by .github/workflows/pull-request.yaml via actions/github-script.
//
// • TEST_RESULT: Test job result
// • MARKER: Hidden comment identifier
// • TEST_FILE / AUDIT_FILE: Downloaded summary fragments
const fs = require('node:fs');

module.exports = async ({ github, context, core }) => {
  const { TEST_RESULT, TEST_FILE, AUDIT_FILE, MARKER } = process.env;

  // Reads a section from a file using the provided extract function.
  const section = (file, extract) => {
    try {
      return extract(fs.readFileSync(file, 'utf8')).trim() || null;
    } catch (err) {
      core.warning(`Could not read ${file}: ${err.message}`);
      return null;
    }
  };

  const testReport =
    section(TEST_FILE, (raw) =>
      raw
        .split('\n')
        .filter(
          (line) =>
            line.startsWith('- **Test Files**:') ||
            line.startsWith('- **Test Results**:'),
        )
        .join('\n'),
    ) ?? '⚠️ No unit-test summary found.';

  const auditReport =
    section(AUDIT_FILE, (raw) => raw) ??
    '⚠️ No dependency-audit summary found.';

  const body = [
    MARKER,
    `## 🧪 Test Report ${TEST_RESULT === 'success' ? '✅' : '❌'}`,
    '',
    testReport,
    '',
    '## 🔍 Dependency Audit',
    '',
    auditReport,
  ].join('\n');

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
