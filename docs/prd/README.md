# Product Requirements Documentation

This folder contains the product requirements documentation for **Team Management**.

## Document map

| File                                              | Contents                                                                              |
| ------------------------------------------------- | ------------------------------------------------------------------------------------- |
| [00-master-prd](./00-master-prd.md)               | Product overview, target users, feature map, shared requirements                      |
| [01-roles-permissions](./01-roles-permissions.md) | Auth layers, role definitions, full permission matrix, client-side enforcement        |
| [pages/README](./pages/README.md)                 | Page catalog with routes and links to every spec                                      |
| `pages/**`                                        | One spec per page (summary → permissions → UX flows → FRs → ACs → technical appendix) |

Read in order: **Master PRD → Roles & Permissions → Page catalog → individual page specs**.

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

```bash
# One-time setup (isolated from the app's pnpm dependencies)
cd .prd-tools && npm install md-to-pdf@5

# Generate PDF
node scripts/build-prd-pdf.mjs
```

Produces `sgr-team-management-prd.pdf` in the repo root. Styling lives in `scripts/prd-pdf.css`.

### Adding a new page

1. Create the spec under `docs/prd/pages/<group>/<page>.md`.
2. Add it to the `MANIFEST` array in `scripts/build-prd-pdf.mjs` at the correct position.
3. Add a row to the catalog table in `docs/prd/pages/README.md`.
