// Dependency vulnerability check. `pnpm audit` works from pnpm-lock.yaml alone,
// so nothing needs to be installed.
//
//   pnpm audit:report   report only, always exits 0 (what CI runs on PRs)
//   pnpm audit:ci       also fails on prod-tree high/critical, or if the audit
//                       could not run
//
// Env: SKIP_AUDIT=1 (skip entirely) · AUDIT_REPORT (JSON path) ·
//      AUDIT_SUMMARY (markdown fragment for the PR comment) · AUDIT_TIMEOUT_MS

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { styleText } from 'node:util';

process.on('unhandledRejection', (error) => {
  throw error;
});

type Severity = 'critical' | 'high' | 'moderate' | 'low' | 'info';
type Counts = Record<Severity, number>;
type Style = Parameters<typeof styleText>[0];

interface Finding {
  version: string;
  /** `.>a>b>pkg` chains from the workspace root. */
  paths: Array<string>;
  /** True when the package is only reachable through devDependencies. */
  dev: boolean;
}

interface Advisory {
  title: string;
  module_name: string;
  severity: Severity;
  /** `<0.0.0` means no patched version exists. */
  patched_versions: string;
  findings: Array<Finding>;
}

/** npm v6 bulk-advisory format, as emitted by `pnpm audit --json`. */
interface AuditReport {
  advisories: Record<string, Advisory>;
  metadata: {
    vulnerabilities: Counts;
    dependencies: number;
    devDependencies: number;
    totalDependencies: number;
  };
}

type AuditResult = { report: AuditReport } | { error: string };

interface Tree {
  label: string;
  counts: Counts;
  advisories: Array<Advisory>;
}

const SEVERITIES: Array<Severity> = [
  'critical',
  'high',
  'moderate',
  'low',
  'info',
];
const GATE: Array<Severity> = ['critical', 'high'];
const STYLE: Record<Severity, Style> = {
  critical: ['red', 'bold'],
  high: 'red',
  moderate: 'yellow',
  low: 'blue',
  info: 'gray',
};
const NO_PATCH = '<0.0.0';
const LABEL_WIDTH = 25;

const gate = process.argv.includes('--gate');
const TIMEOUT_MS = Number(
  process.env.AUDIT_TIMEOUT_MS ?? (gate ? 300_000 : 60_000),
);
const reportPath = path.resolve(process.env.AUDIT_REPORT ?? 'pnpm-audit.json');
const summaryPath = process.env.AUDIT_SUMMARY
  ? path.resolve(process.env.AUDIT_SUMMARY)
  : null;
// Relative for readability, unless the override climbs out of the repo.
const reportLabel = (() => {
  const relative = path.relative(process.cwd(), reportPath);
  return relative.startsWith('..') ? reportPath : relative;
})();

const paint = (style: Style, text: string): string => styleText(style, text);
const seconds = (ms: number): string => `${(ms / 1000).toFixed(1)}s`;
const labelled = (label: string, value: string): string =>
  `${label.padEnd(LABEL_WIDTH)}${value}`;
const blocking = (counts: Counts): number =>
  GATE.reduce((sum, s) => sum + (counts[s] ?? 0), 0);

// pnpm sets npm_execpath to whichever pnpm is running the script: a native
// binary, or a .cjs shim under corepack. Bare `pnpm` is the by-hand fallback.
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

// ---------------------------------------------------------------------------
// Audit
// ---------------------------------------------------------------------------

/** One `pnpm audit --json` run over the full tree. */
const runAudit = (): Promise<AuditResult> =>
  new Promise((resolve) => {
    const pnpm = resolvePnpm();
    const child = spawn(pnpm.command, [...pnpm.args, 'audit', '--json'], {
      timeout: TIMEOUT_MS,
    });

    let stdout = '';
    let stderr = '';
    child.stdout
      .setEncoding('utf8')
      .on('data', (chunk: string) => (stdout += chunk));
    child.stderr
      .setEncoding('utf8')
      .on('data', (chunk: string) => (stderr += chunk));

    child.on('error', (error: Error) =>
      resolve({ error: `pnpm audit could not be spawned: ${error.message}` }),
    );

    // Exit code is non-zero whenever anything was found; only the payload
    // says whether the audit itself worked.
    child.on('close', (code: number | null, signal: string | null) => {
      if (signal && !stdout) {
        resolve({
          error: `pnpm audit timed out after ${seconds(TIMEOUT_MS)} — registry slow or unreachable. Override with AUDIT_TIMEOUT_MS.`,
        });
        return;
      }

      let report: AuditReport;
      try {
        report = JSON.parse(stdout) as AuditReport;
      } catch {
        resolve({
          error: `pnpm audit produced no parseable report (exit ${code}): ${(stderr || stdout).trim().slice(0, 500)}`,
        });
        return;
      }

      if (!report?.metadata?.vulnerabilities) {
        resolve({
          error: `pnpm audit did not complete: ${JSON.stringify(report).slice(0, 500)}`,
        });
        return;
      }

      resolve({ report });
    });
  });

/**
 * Both trees from one report. The prod tree is every advisory with at least
 * one non-dev finding — the same set `pnpm audit --prod` returns, without a
 * second registry round-trip.
 */
const splitTrees = (report: AuditReport): { full: Tree; prod: Tree } => {
  const all = Object.values(report.advisories ?? {});
  const prodAdvisories = all.filter((a) => a.findings.some((f) => !f.dev));
  const count = (advisories: Array<Advisory>): Counts => {
    const counts = Object.fromEntries(SEVERITIES.map((s) => [s, 0])) as Counts;
    for (const a of advisories) counts[a.severity]++;
    return counts;
  };

  return {
    full: {
      label: 'Full tree (dev + prod):',
      counts: report.metadata.vulnerabilities,
      advisories: all,
    },
    prod: {
      label: 'Production tree only:',
      counts: count(prodAdvisories),
      advisories: prodAdvisories,
    },
  };
};

// ---------------------------------------------------------------------------
// Terminal output
// ---------------------------------------------------------------------------

/** Single-line spinner with elapsed time; announces once when not a TTY. */
const startSpinner = (label: string): (() => void) => {
  if (!process.stdout.isTTY) {
    console.log(paint('gray', `   ${label}...`));
    return () => {};
  }

  const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  const startedAt = Date.now();
  let frame = 0;
  const timer = setInterval(() => {
    const spun = paint('cyan', frames[frame++ % frames.length] as string);
    process.stdout.write(
      `\r\x1b[2K${spun} ${paint('gray', `${label} ${seconds(Date.now() - startedAt)}`)}`,
    );
  }, 100);

  return () => {
    clearInterval(timer);
    process.stdout.write('\r\x1b[2K');
  };
};

const formatCounts = (counts: Counts): string =>
  SEVERITIES.map((s) => {
    const n = counts[s] ?? 0;
    return paint(n === 0 ? 'gray' : STYLE[s], `${s} ${n}`);
  }).join('  ');

/** Gate-severity advisories, worst first, one two-line entry each. */
const formatOffenders = (advisories: Array<Advisory>): string =>
  advisories
    .filter((a) => GATE.includes(a.severity))
    .sort(
      (a, b) =>
        SEVERITIES.indexOf(a.severity) - SEVERITIES.indexOf(b.severity) ||
        a.module_name.localeCompare(b.module_name),
    )
    .map((a) => {
      const versions = [...new Set(a.findings.map((f) => f.version))].join(
        ', ',
      );
      // A `.>pkg` chain means we depend on it directly.
      const depth = a.findings.some((f) =>
        f.paths.some((p) => p.split('>').length === 2),
      )
        ? 'direct'
        : 'transitive';
      const fix =
        a.patched_versions === NO_PATCH
          ? paint('red', 'no fix available')
          : `fixed in ${a.patched_versions}`;
      // Pad before painting: escape codes count toward padEnd.
      const severity = paint(STYLE[a.severity], a.severity.padEnd(8));
      return `  ${severity} ${a.module_name}@${versions} (${depth}, ${fix})\n${paint('gray', `             ${a.title}`)}`;
    })
    .join('\n');

const printReport = (report: AuditReport, full: Tree, prod: Tree): boolean => {
  const { dependencies, devDependencies, totalDependencies } = report.metadata;
  console.log(labelled(full.label, formatCounts(full.counts)));
  console.log(
    paint(
      'gray',
      labelled(
        'Packages audited:',
        `${totalDependencies} (${dependencies} prod, ${devDependencies} dev)`,
      ),
    ),
  );
  console.log(paint('gray', labelled('Full report:', reportLabel)));
  console.log(`\n${labelled(prod.label, formatCounts(prod.counts))}`);

  const n = blocking(prod.counts);
  if (n === 0) {
    console.log(
      `${paint('green', '✓')} No high or critical advisories in shipped code.`,
    );
    return true;
  }

  const mark = gate ? paint('red', '✖') : paint('yellow', '!');
  console.log(
    `\n${mark} ${n} high/critical advisor${n === 1 ? 'y' : 'ies'} in shipped code:`,
  );
  console.log(formatOffenders(prod.advisories));
  console.log(paint('gray', '\nRun `pnpm audit --prod` for the full detail.'));

  return false;
};

// ---------------------------------------------------------------------------
// Markdown for the PR comment
//
// GitHub colours a fenced `diff` block: `-` red, `+` green. One line per tree,
// red when it has anything blocking. Detail stays in the log and JSON report.
// ---------------------------------------------------------------------------

const auditMarkdown = (result: AuditResult): string => {
  const lines: Array<string> = [];

  if ('error' in result) {
    lines.push(`- ${labelled('Audit could not run:', result.error)}`);
  } else {
    const { full, prod } = splitTrees(result.report);
    const digits = Object.fromEntries(
      SEVERITIES.map((s) => [
        s,
        Math.max(
          String(full.counts[s] ?? 0).length,
          String(prod.counts[s] ?? 0).length,
        ),
      ]),
    ) as Counts;
    const row = (counts: Counts): string =>
      SEVERITIES.map(
        (s) => `${s} ${String(counts[s] ?? 0).padStart(digits[s])}`,
      ).join('  ');

    for (const tree of [full, prod]) {
      lines.push(
        `${blocking(tree.counts) ? '-' : '+'} ${labelled(tree.label, row(tree.counts))}`,
      );
    }

    const { dependencies, devDependencies, totalDependencies } =
      result.report.metadata;

    lines.push(
      `  ${labelled('Packages audited:', `${totalDependencies} (${dependencies} prod, ${devDependencies} dev)`)}`,
    );
  }

  lines.push(
    `  ${labelled('Full report:', `${reportLabel} (run pnpm audit:report locally)`)}`,
  );

  return ['```diff', ...lines, '```'].join('\n');
};

// ---------------------------------------------------------------------------

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
      `   started ${new Date(startedAt).toLocaleTimeString()} · timeout ${seconds(TIMEOUT_MS)}\n`,
    ),
  );

  const stopSpinner = startSpinner('auditing lockfile');
  const result = await runAudit();
  stopSpinner();

  let ok: boolean;
  if ('error' in result) {
    console.error(`${paint('red', '✖')} ${result.error}`);
    ok = false;
  } else {
    fs.writeFileSync(reportPath, JSON.stringify(result.report, null, 2));
    const { full, prod } = splitTrees(result.report);
    ok = printReport(result.report, full, prod);
  }

  // Only written when CI asked for it; locally it is noise.
  if (summaryPath) fs.writeFileSync(summaryPath, `${auditMarkdown(result)}\n`);

  console.log(
    paint('gray', `\n⌛ Audited in ${seconds(Date.now() - startedAt)}`),
  );

  // A failed audit always says so out loud; only the gate fails the build.
  return gate && !ok ? 1 : 0;
};

// exitCode rather than process.exit() so buffered stdout drains.
main().then((code) => {
  process.exitCode = code;
});
