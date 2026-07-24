# Product Requirements Documentation

This folder contains the product requirements documentation for **Team Management**.

## Document map

| File                                              | Contents                                                                                 |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| [00-overview](./00-overview.md)                   | Vision, personas, goals & metrics, non-goals, constraints, shared requirements           |
| [01-roles-permissions](./01-roles-permissions.md) | Auth layers, role definitions, full permission matrix, client-side enforcement           |
| [ARCHITECTURE.md](../../ARCHITECTURE.md)          | Technical architecture (repo root — included in the PDF between roles and feature specs) |
| [features/README](./features/README.md)           | Feature catalog with routes, statuses, and links to every spec                           |
| `features/**`                                     | One spec per feature/page (summary → permissions → UX flows → FRs → ACs → tech appendix) |
| [90-roadmap](./90-roadmap.md)                     | Release plan: shipped / in progress / planned / not planned                              |
| [99-changelog](./99-changelog.md)                 | Revision history of the PRD itself                                                       |

Read in order: **Overview → Roles & Permissions → Feature catalog → individual specs → Roadmap**.

## Conventions

- Every feature spec starts with a status line: `> Route: \`/x\` · Nav group: **X** · Status: **Draft | Approved | Shipped**`. Keep it current — it's the at-a-glance lifecycle marker in both GitHub and the PDF.
- Numbered files (`00`, `01`, `90`, `99`) are the linear read; the gap before `90` leaves room for new sections without renumbering.
- Record meaningful doc changes in [99-changelog](./99-changelog.md).

## PDF export

All docs are stitched into a single PDF by `scripts/build-prd-pdf.mjs` (Puppeteer via `md-to-pdf`). Section order is controlled by the `MANIFEST` array in that script — **add a new page there** to include it in the PDF.

### CI (GitHub Actions)

**Workflow:** `.github/workflows/prd-pdf.yml` — named **PRD PDF**

Triggers automatically on push to `main` when any of the following change:

- `docs/prd/**`
- `scripts/build-prd-pdf.mjs`
- `scripts/prd-pdf.css`

Or run manually: **Actions → PRD PDF → Run workflow**.

**Output:** `sgr-team-management-prd.pdf` uploaded as a build artifact.
Open the workflow run → **Artifacts** → download **Product Requirements Document**.

### Local preview

One-time setup (isolated from the app's pnpm dependencies).

```bash
# Install md-to-pdf under .prd-tools, then symlink it where the ESM import resolves.
mkdir -p .prd-tools
echo '{"name":"prd-tools","private":true}' > .prd-tools/package.json
(cd .prd-tools && npm install md-to-pdf@5)
ln -sfn "$PWD/.prd-tools/node_modules" scripts/node_modules
```

Generate PDF:

```bash
node scripts/build-prd-pdf.mjs
```

Produces `sgr-team-management-prd.pdf` in the repo root. Styling lives in `scripts/prd-pdf.css`.

### Adding a new feature spec

1. Create the spec under `docs/prd/features/<group>/<page>.md`.
2. Add it to the `MANIFEST` array in `scripts/build-prd-pdf.mjs` at the correct position.
3. Add a row to the catalog table in `docs/prd/features/README.md`.
4. Note it in `docs/prd/99-changelog.md`.
