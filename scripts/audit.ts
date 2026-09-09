// Dependency vulnerability check.
//
// `pnpm audit` resolves the dependency tree from pnpm-lock.yaml and asks the
// registry for advisories, so this needs nothing installed to produce a
// verdict — the lockfile is enough.
//
// Two modes:
//   pnpm audit:report  report-only; always exits 0. This is what CI runs, so a
//                      new advisory reports itself on the PR without blocking
//                      an unrelated change.
//   pnpm audit:ci      also fails on prod-tree high/critical, and on an audit
//                      that could not run at all.
//
// Both are wrappers around this script; `pnpm audit` itself stays the raw
// pnpm command.
//
// Environment:
//   SKIP_AUDIT=1    opt out entirely (offline/air-gapped builds)
//   AUDIT_REPORT    where to write the full JSON report
//   AUDIT_SUMMARY   where to write the markdown fragment CI puts on the PR
//   AUDIT_TIMEOUT_MS  per-tree registry timeout

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { styleText } from 'node:util';

process.on('unhandledRejection', (error) => {
  throw error;
});

type Severity = 'critical' | 'high' | 'moderate' | 'low' | 'info';

/** One installed version of a vulnerable package, and how we depend on it. */
interface Finding {
  version: string;
  /** `.>a>b>pkg` chains from the workspace root down to the vulnerable package. */
  paths: Array<string>;
  dev: boolean;
  optional: boolean;
  bundled: boolean;
}

interface Advisory {
  id: number;
  title: string;
  module_name: string;
  severity: Severity;
  url: string;
  cwe?: string;
  github_advisory_id: string;
  vulnerable_versions: string;
  /** `<0.0.0` is how the registry says "no patched version exists". */
  patched_versions: string;
  findings: Array<Finding>;
}

/**
 * `pnpm audit --json` speaks the npm v6 bulk-advisory format: advisories keyed
 * by numeric id, and dependency counts as plain numbers.
 */
interface AuditReport {
  advisories: Record<string, Advisory>;
  metadata: {
    vulnerabilities: Record<Severity, number>;
    dependencies: number;
    devDependencies: number;
    optionalDependencies: number;
    totalDependencies: number;
  };
}

type AuditResult = { report: AuditReport } | { error: string };

type Style = Parameters<typeof styleText>[0];

// Severity order the registry reports in, worst first.
const SEVERITIES: Array<Severity> = [
  'critical',
  'high',
  'moderate',
  'low',
  'info',
];
// Everything at or above `high` fails the gate. Matches
// `pnpm audit --audit-level=high`.
const GATE_SEVERITIES: Array<Severity> = ['critical', 'high'];
const SEVERITY_STYLE: Record<Severity, Style> = {
  critical: ['red', 'bold'],
  high: 'red',
  moderate: 'yellow',
  low: 'blue',
  info: 'gray',
};
const NO_PATCH = '<0.0.0';

const gate = process.argv.includes('--gate');

const AUDIT_TIMEOUT_MS = Number(
  process.env.AUDIT_TIMEOUT_MS ?? (gate ? 300_000 : 60_000),
);
const reportPath = path.resolve(
  process.cwd(),
  process.env.AUDIT_REPORT ?? 'pnpm-audit.json',
);
// Opt-in: the markdown fragment CI feeds to the PR comment.
const summaryPath = process.env.AUDIT_SUMMARY
  ? path.resolve(process.cwd(), process.env.AUDIT_SUMMARY)
  : null;
// How the report path is worth naming to a reader: relative from the repo, but
// a relative path that climbs out of the repo is worse than no relative path at
// all, which is what an AUDIT_REPORT override can produce.
const reportLabel = (() => {
  const relative = path.relative(process.cwd(), reportPath);
  return relative.startsWith('..') ? reportPath : relative;
})();

/**
 * How to invoke pnpm.
 *
 * pnpm exports `npm_execpath` for every script it runs, pointing at whichever
 * pnpm is actually driving the install — a native binary when installed
 * standalone or via Homebrew, a `.cjs` shim under corepack. Falling back to a
 * bare `pnpm` resolves through PATH, which is only reachable when the script
 * is run by hand rather than through a lifecycle script.
 */
const resolvePnpm = (): { command: string; args: Array<string> } => {
  const fromEnv = process.env.npm_execpath;
  if (
    fromEnv &&
    path.basename(fromEnv).startsWith('pnpm') &&
    fs.existsSync(fromEnv)
  ) {
    return /\.[cm]?js$/.test(fromEnv)
      ? { command: process.execPath, args: [fromEnv] }
      : { command: fromEnv, args: [] };
  }
  return { command: 'pnpm', args: [] };
};

const PNPM = resolvePnpm();

const seconds = (ms: number): string => `${(ms / 1000).toFixed(1)}s`;

const paint = (style: Style, text: string): string => styleText(style, text);

/** Runs one `pnpm audit` invocation and parses its JSON report. */
const runAudit = (extraArgs: Array<string>): Promise<AuditResult> =>
  new Promise((resolve) => {
    const child = spawn(
      PNPM.command,
      [...PNPM.args, 'audit', '--json', ...extraArgs],
      { timeout: AUDIT_TIMEOUT_MS },
    );

    let stdout = '';
    let stderr = '';
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk: string) => {
      stdout += chunk;
    });
    child.stderr.on('data', (chunk: string) => {
      stderr += chunk;
    });

    child.on('error', (error: Error) => {
      resolve({ error: `pnpm audit could not be spawned: ${error.message}` });
    });

    // pnpm exits non-zero whenever it found anything, so the exit code says
    // nothing about whether the audit itself succeeded — only the payload does.
    child.on('close', (code: number | null, signal: string | null) => {
      // `timeout` kills the child with a signal rather than reporting an error,
      // so a signalled exit with no output is how a timeout surfaces here.
      if (signal && !stdout) {
        resolve({
          error:
            `pnpm audit timed out after ${seconds(AUDIT_TIMEOUT_MS)} — the ` +
            'registry is slow or unreachable from here. Override with ' +
            'AUDIT_TIMEOUT_MS.',
        });
        return;
      }

      let report: AuditReport;
      try {
        report = JSON.parse(stdout) as AuditReport;
      } catch {
        const detail = (stderr || stdout).trim().slice(0, 500);
        resolve({
          error: `pnpm audit produced no parseable report (exit ${code}): ${detail}`,
        });
        return;
      }

      if (!report?.metadata?.vulnerabilities) {
        const detail = JSON.stringify(report).slice(0, 500);
        resolve({ error: `pnpm audit did not complete: ${detail}` });
        return;
      }

      resolve({ report });
    });
  });

// ---------------------------------------------------------------------------
// Progress
//
// `pnpm audit --json` emits nothing until it is done, and it is one registry
// round-trip.
// ---------------------------------------------------------------------------

const SPINNER_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
const SPINNER_INTERVAL_MS = 100;
// Erase the whole line and park the cursor at column 0, so each repaint
// replaces the previous one instead of appending to it.
const CLEAR_LINE = '\r\x1b[2K';

interface Step {
  label: string;
  elapsed: () => number;
  isDone: () => boolean;
  finish: () => void;
}

/** One tracked step: its label and how long it has been running. */
const step = (label: string): Step => {
  const startedAt = Date.now();
  let finishedAt: number | null = null;
  return {
    label,
    elapsed: () => (finishedAt ?? Date.now()) - startedAt,
    isDone: () => finishedAt !== null,
    finish: () => {
      finishedAt = Date.now();
    },
  };
};

/**
 * Repaints a live spinner over `steps` until the returned stop() is called.
 *
 * TTY only. In a CI log a repainting line is just thousands of lines of noise,
 * so there each step is announced once up front and the total duration is
 * reported at the end.
 */
const startSpinner = (steps: Array<Step>): (() => void) => {
  if (!process.stdout.isTTY) {
    for (const tracked of steps) {
      console.log(paint('gray', `   auditing ${tracked.label}...`));
    }
    return () => {};
  }

  let frame = 0;
  const timer = setInterval(() => {
    const spun = paint(
      'cyan',
      SPINNER_FRAMES[frame++ % SPINNER_FRAMES.length] as string,
    );
    const parts = steps.map((tracked) => {
      const text = `${tracked.label} ${seconds(tracked.elapsed())}`;
      return tracked.isDone()
        ? paint('green', `${text} ✓`)
        : paint('gray', text);
    });
    process.stdout.write(
      `${CLEAR_LINE}${spun} ${parts.join(paint('gray', ' · '))}`,
    );
  }, SPINNER_INTERVAL_MS);

  return () => {
    clearInterval(timer);
    process.stdout.write(CLEAR_LINE);
  };
};

/** Runs `task`, marking `tracked` finished as soon as it settles. */
const track = async <T>(tracked: Step, task: () => Promise<T>): Promise<T> => {
  const outcome = await task();
  tracked.finish();
  return outcome;
};

// ---------------------------------------------------------------------------
// Reporting
// ---------------------------------------------------------------------------

/** Severity counts, each tinted by severity — but only when non-zero. */
const formatCounts = (counts: Record<Severity, number>): string =>
  SEVERITIES.map((severity) => {
    const count = counts[severity] ?? 0;
    const text = `${severity} ${count}`;
    return count === 0
      ? paint('gray', text)
      : paint(SEVERITY_STYLE[severity], text);
  }).join('  ');

/** A `.>pkg` chain has no intermediate package: we depend on it ourselves. */
const isDirect = (advisory: Advisory): boolean =>
  advisory.findings.some((finding) =>
    finding.paths.some((chain) => chain.split('>').length === 2),
  );

/** One gate-severity advisory, reduced to the fields both renderers need. */
interface Offender {
  severity: Severity;
  /** `name@version`, listing every installed copy the advisory matched. */
  package: string;
  depth: 'direct' | 'transitive';
  /** The first patched range, or null when the registry knows of no fix. */
  fix: string | null;
  title: string;
}

/** Advisories at or above the gate severity, worst first. */
const gateOffenders = (report: AuditReport): Array<Offender> =>
  Object.values(report.advisories ?? {})
    .filter((advisory) => GATE_SEVERITIES.includes(advisory.severity))
    .sort(
      (a, b) =>
        SEVERITIES.indexOf(a.severity) - SEVERITIES.indexOf(b.severity) ||
        a.module_name.localeCompare(b.module_name),
    )
    .map((advisory) => ({
      severity: advisory.severity,
      // One advisory can match several installed copies of the same package.
      package: `${advisory.module_name}@${[
        ...new Set(advisory.findings.map((finding) => finding.version)),
      ].join(', ')}`,
      depth: isDirect(advisory) ? ('direct' as const) : ('transitive' as const),
      fix:
        advisory.patched_versions === NO_PATCH
          ? null
          : advisory.patched_versions,
      title: advisory.title,
    }));

/** The offender list as a coloured block for the terminal. */
const formatOffenders = (offenders: Array<Offender>): string =>
  offenders
    .map((offender) => {
      const fix = offender.fix
        ? `fixed in ${offender.fix}`
        : paint('red', 'no fix available');
      // Pad before coloring: the escape codes are zero-width on screen but
      // very much not zero-length to padEnd.
      const severity = paint(
        SEVERITY_STYLE[offender.severity],
        offender.severity.padEnd(8),
      );
      const headline = `  ${severity} ${offender.package} (${offender.depth}, ${fix})`;
      return `${headline}\n${paint('gray', `             ${offender.title}`)}`;
    })
    .join('\n');

// ---------------------------------------------------------------------------
// Markdown, for the job summary and the PR comment
//
// A PR comment has no colour of its own, but GitHub does highlight a fenced
// `diff` block: `-` lines red, `+` lines green, everything else plain. So the
// fragment is the same aligned block the terminal prints, one line per tree,
// marked by whether that tree has anything blocking in it. The advisory detail
// stays in the CI log and the JSON report rather than the comment — four lines
// is what a reviewer scrolls past, not four screens.
// ---------------------------------------------------------------------------

/** Width the terminal report aligns its values to, reused here. */
const LABEL_WIDTH = 25;

/** Number of gate-severity advisories, or null when the audit did not run. */
const blockingTotal = (result: AuditResult): number | null =>
  'error' in result
    ? null
    : GATE_SEVERITIES.reduce(
        (sum, severity) =>
          sum + (result.report.metadata.vulnerabilities[severity] ?? 0),
        0,
      );

const labelled = (label: string, value: string): string =>
  `${label.padEnd(LABEL_WIDTH)}${value}`;

/**
 * `critical 2  high 11  moderate 23  low 1  info 0`, with every count padded to
 * the widest across both trees so the two rows line up under each other.
 */
const countsRow = (
  counts: Record<Severity, number>,
  digits: Record<Severity, number>,
): string =>
  SEVERITIES.map(
    (severity) =>
      `${severity} ${String(counts[severity] ?? 0).padStart(digits[severity] as number)}`,
  ).join('  ');

/** The audit as a markdown fragment: one colour-marked line per tree. */
const auditMarkdown = (full: AuditResult, prod: AuditResult): string => {
  const trees = [
    { label: 'Full tree (dev + prod):', result: full },
    { label: 'Production tree only:', result: prod },
  ];
  const reports = trees.flatMap((tree) =>
    'error' in tree.result ? [] : [tree.result.report],
  );

  const digits = Object.fromEntries(
    SEVERITIES.map((severity) => [
      severity,
      Math.max(
        1,
        ...reports.map(
          (report) =>
            String(report.metadata.vulnerabilities[severity] ?? 0).length,
        ),
      ),
    ]),
  ) as Record<Severity, number>;

  const lines = trees.map((tree) => {
    if ('error' in tree.result) {
      return `- ${labelled(tree.label, `audit could not run — ${tree.result.error}`)}`;
    }
    const counts = countsRow(
      tree.result.report.metadata.vulnerabilities,
      digits,
    );
    // Red when this tree has something at or above the gate, green when clean.
    return `${blockingTotal(tree.result) ? '-' : '+'} ${labelled(tree.label, counts)}`;
  });

  // Both trees walk the same lockfile, so either one can report the totals —
  // but only the full tree knows the dev/prod split.
  const [counted] = reports;
  if (counted) {
    const { dependencies, devDependencies, totalDependencies } =
      counted.metadata;
    lines.push(
      `  ${labelled('Packages audited:', `${totalDependencies} (${dependencies} prod, ${devDependencies} dev)`)}`,
    );
  }
  lines.push(
    `  ${labelled('Full report:', `${reportLabel} (run pnpm audit:report locally)`)}`,
  );

  return ['```diff', ...lines, '```'].join('\n');
};

/** Report-only: the whole tree, i.e. the dev/build-time backlog. */
const reportFullTree = (result: AuditResult): boolean => {
  if ('error' in result) {
    console.error(`${paint('red', '✖')} ${result.error}`);
    return false;
  }

  fs.writeFileSync(reportPath, JSON.stringify(result.report, null, 2));

  const { vulnerabilities, dependencies, devDependencies, totalDependencies } =
    result.report.metadata;
  console.log(`Full tree (dev + prod):  ${formatCounts(vulnerabilities)}`);
  console.log(
    paint(
      'gray',
      `Packages audited:        ${totalDependencies} ` +
        `(${dependencies} prod, ${devDependencies} dev)`,
    ),
  );
  console.log(paint('gray', `Full report written to ${reportLabel}`));
  return true;
};

/**
 * The gate: the production tree only — everything that actually ships to a
 * browser.
 */
const reportProdTree = (result: AuditResult): boolean => {
  if ('error' in result) {
    console.error(`${paint('red', '✖')} ${result.error}`);
    return false;
  }

  const counts = result.report.metadata.vulnerabilities;
  const blocking = GATE_SEVERITIES.reduce(
    (sum, severity) => sum + (counts[severity] ?? 0),
    0,
  );

  console.log(`\nProduction tree only:    ${formatCounts(counts)}`);

  if (blocking === 0) {
    console.log(
      `${paint('green', '✓')} No high or critical advisories in shipped code.`,
    );
    return true;
  }

  console.log(
    `\n${gate ? paint('red', '✖') : paint('yellow', '!')} ${blocking} high/critical ` +
      `advisor${blocking === 1 ? 'y' : 'ies'} in shipped code:`,
  );
  console.log(formatOffenders(gateOffenders(result.report)));
  console.log(paint('gray', '\nRun `pnpm audit --prod` for the full detail.'));
  return false;
};

const main = async (): Promise<number> => {
  if (process.env.SKIP_AUDIT === '1') {
    console.log(paint('gray', '🔍 SKIP_AUDIT=1 — dependency audit skipped.'));
    return 0;
  }

  if (!gate) {
    console.log(
      paint(
        'gray',
        'Report-only mode — run `pnpm audit:ci` to apply the gate.\n',
      ),
    );
  }

  const startedAt = Date.now();
  console.log('🔍 Auditing dependencies with pnpm');
  console.log(
    paint(
      'gray',
      `   started ${new Date(startedAt).toLocaleTimeString()} · ` +
        `timeout ${seconds(AUDIT_TIMEOUT_MS)} per tree\n`,
    ),
  );

  // Two independent registry round-trips, so they run concurrently.
  const fullTreeStep = step('full tree');
  const prodTreeStep = step('production tree');
  const stopSpinner = startSpinner([fullTreeStep, prodTreeStep]);
  const [fullTree, prodTree] = await Promise.all([
    track(fullTreeStep, () => runAudit([])),
    track(prodTreeStep, () => runAudit(['--prod'])),
  ]);
  stopSpinner();

  const fullTreeOk = reportFullTree(fullTree);
  const prodTreeOk = reportProdTree(prodTree);

  // CI reads this back to build the PR comment; locally it is just noise, so
  // it is only written when a destination was asked for.
  if (summaryPath) {
    const markdown = auditMarkdown(fullTree, prodTree);
    fs.writeFileSync(summaryPath, `${markdown}\n`);
  }

  console.log(
    paint('gray', `\n⌛ Audited in ${seconds(Date.now() - startedAt)}`),
  );

  // A tree we could not read means the audit did not happen, and should say so
  // out loud rather than pass silently — but only the gate turns that into a
  // failing exit code.
  if (!gate) return 0;
  return fullTreeOk && prodTreeOk ? 0 : 1;
};

// Setting exitCode rather than calling process.exit() lets buffered stdout
// drain first.
main().then((code) => {
  process.exitCode = code;
});
