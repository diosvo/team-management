#!/usr/bin/env node
/**
 * Stitch the PRD docs under docs/prd/ into a single Markdown file and render it
 * to sgr-team-management-prd.pdf via md-to-pdf (Puppeteer/Chromium).
 *
 * Run locally: node scripts/build-prd-pdf.mjs
 * CI: .github/workflows/prd-pdf.yml
 *
 * MANIFEST is the single source of truth for section order — add a page here.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { mdToPdf } from 'md-to-pdf';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PRD = join(ROOT, 'docs', 'prd');

const OUTPUT = join(ROOT, 'sgr-team-management-prd.pdf');
const STYLE = join(ROOT, 'scripts', 'prd-pdf.css');
const BUILD_DIR = join(ROOT, '.prd-build');
const REPORT_MD = join(BUILD_DIR, 'report.md');

/** Ordered list of docs to stitch (relative to docs/prd/). */
const MANIFEST = [
  'README.md',
  '00-master-prd.md',
  '01-roles-permissions.md',
  'pages/README.md',
  'pages/overview/dashboard.md',
  'pages/overview/team-rule.md',
  'pages/team-management/roster.md',
  'pages/team-management/training.md',
  'pages/team-management/attendance.md',
  'pages/team-management/registration.md',
  'pages/team-management/matches.md',
  'pages/performance/periodic-testing.md',
  'pages/resources/assets.md',
  'pages/settings/teams.md',
  'pages/settings/leagues.md',
  'pages/settings/locations.md',
  'pages/profile.md',
];

const PAGE_BREAK = '\n\n<div class="page-break"></div>\n\n';

const COVER = [
  '<div class="cover">',
  '<h1>Basketball Team Management</h1>',
  '<h2>Product Requirements Documentation</h2>',
  '<p class="cover-sub">Saigon Rovers Basketball Club</p>',
  '</div>',
].join('\n');

async function main() {
  const sections = [];
  for (const rel of MANIFEST) {
    const md = await readFile(join(PRD, rel), 'utf8');
    sections.push(md.trim());
  }

  const stitched = [COVER, ...sections].join(PAGE_BREAK) + '\n';

  await mkdir(BUILD_DIR, { recursive: true });
  await writeFile(REPORT_MD, stitched, 'utf8');

  const config = {
    dest: OUTPUT,
    stylesheet: [STYLE],
    pdf_options: {
      format: 'A4',
      margin: { top: '20mm', bottom: '20mm', left: '18mm', right: '18mm' },
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: '<span></span>',
      footerTemplate:
        '<div style="width:100%;font-size:9px;color:#888;padding:0 18mm;text-align:right;">' +
        '<span class="pageNumber"></span> / <span class="totalPages"></span></div>',
    },
    // ubuntu-latest sandboxing can block Chromium
    // --no-sandbox is safe in CI.
    launch_options: { args: ['--no-sandbox', '--disable-setuid-sandbox'] },
  };

  const pdf = await mdToPdf({ path: REPORT_MD }, config);

  if (!pdf) throw new Error('md-to-pdf returned no output');
  console.log(`✅ Wrote ${OUTPUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
