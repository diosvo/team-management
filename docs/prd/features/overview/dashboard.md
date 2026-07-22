# Dashboard

> Route: `/dashboard` · Nav group: **Overview** · Status: **Draft**

## 1. Summary

- The **Dashboard** is the default landing page after login (`DEFAULT_LOGIN_REDIRECT`).
- It presents team analytics (charts, key figures) for a selected time `interval`.
- A **PDF Reports** capability lets users export the analytics exactly as rendered
  on screen (see §5 — _PDF Reports_).

## 2. Goals / Metrics

### Goals

- Give every role an at-a-glance view of team health and activity.
- Let authorized users export/share the analytics as a print-ready PDF.

### Metrics

- Time to first meaningful render of the dashboard.
- Time to produce a PDF report (render + serve).

## 3. Users & Permissions

| Role             | View dashboard | Download PDF |
| ---------------- | -------------- | ------------ |
| GUEST            | Yes            | Yes          |
| PLAYER           | Yes            | Yes          |
| COACH            | Yes            | Yes          |
| SUPER_ADMIN      | Yes            | Yes          |
| PLAYER (Captain) | Yes            | Yes          |

> PDF download requires an active session. Any authenticated user who can view the dashboard can download the report.

## 4. UX / Flows

### Entry point

- Sidebar → **Dashboard** (also the post-login redirect).

### View

- Analytics are scoped by an `interval` selector carried in the URL query params.

### Export (PDF Reports)

- A "Download report" action posts the current dashboard URL to the report API and
  streams back a PDF that matches the on-screen analytics for the selected interval.

## 5. Functional Requirements

### Analytics view

- **FR-1:** All roles can view the dashboard analytics.
- **FR-2:** The `interval` selector updates the analytics and is reflected in the URL.

### PDF Reports

A "Download report" action posts the current dashboard URL to `POST /api/reports/dashboard`, which renders the live page server-side (Puppeteer + Chromium), isolates the analytics grid, and streams the result as a PDF.

#### Architecture

```
trigger                ┌──────────────────────────────────┐   sink
──────────────         │  POST /api/reports/dashboard      │   ──────────────
manual click  ───────▶ │  puppeteer-core + @sparticuz/     │ ──▶ stream to browser
                       │  chromium → load live dashboard   │
                       │  URL (session cookies forwarded)  │
                       │  → strip DOM to analytics grid    │
                       │  → page.pdf() → Buffer            │
                       └──────────────────────────────────┘
```

- **Why Puppeteer:** the dashboard uses Recharts (client-side SVG); a real browser render is required for accurate PDF output.
- **Reuses the live dashboard:** the server renders the authenticated dashboard URL directly and strips the DOM to the analytics grid. No separate print route to maintain.
- **Deployment:** `puppeteer-core` + `@sparticuz/chromium` (serverless-compatible); route `maxDuration` set to accommodate Puppeteer cold start.

#### Phase 1 — Manual download (implemented)

- **FR-3:** A "Download report" action on the Dashboard posts the current `interval` to `POST /api/reports/dashboard`, producing a PDF that reflects the selected time range.
- **FR-4:** The PDF visually matches the on-screen dashboard analytics; the server renders the live page and keeps only the analytics grid (2-column layout).
- **FR-5:** Generation runs entirely server-side; nothing is persisted and no file is written to disk (bytes stream straight to the client).
- **FR-6:** The client shows a loading state during generation and a toast on error.
- **FR-7:** Non-ASCII (Vietnamese) filenames are preserved (RFC 5987 `filename*`).

#### Phase 2 — Persistence + email _(planned)_

- **FR-8:** Generated PDFs upload to Vercel Blob.
- **FR-9:** Each report writes a metadata row (see Technical Appendix).
- **FR-10:** Downloads are served through an auth-guarded route.
- **FR-11:** A report can be emailed to a recipient list via Resend.

#### Phase 3 — Scheduling + reports page _(planned)_

- **FR-12:** Users can configure schedules (frequency, recipients, time range).
- **FR-13:** A cron trigger generates due reports using the same engine.
- **FR-14:** A reports page lists history with status, period, and download link.
- **FR-15:** Failed cron runs are recorded with an error and surfaced in the list.
- **FR-16:** A retention policy deletes old Blobs and marks rows `expired`.

## 6. Acceptance Criteria (Given/When/Then)

- **AC-1:** Given I am on the Dashboard with `interval=last_30_days`, when I click "Download report", then I receive a PDF matching the on-screen analytics for that interval.
- **AC-2:** Given report generation fails, when I click download, then I see an error toast and no file is downloaded.

## 7. Technical Appendix

### Report API (Phase 1)

- `POST /api/reports/dashboard` — accepts `{ interval, filename }`, launches Chromium, forwards session cookies, renders the live dashboard, strips the DOM to the analytics grid (2 columns), and returns PDF bytes via `page.pdf()`.
- Browser is always closed in a `finally` block; no temp file is written.

### Data model — `reports` (Phase 2, logical)

- `id`: uuid
- `created_at`: timestamp
- `period_start` / `period_end`: timestamp
- `trigger`: enum [`manual-archived`, `cron`]
- `blob_pathname`: string
- `status`: enum [`success`, `failed`, `expired`]
- `emailed_to`: string[] (nullable)

### Data model — `report_schedules` (Phase 3, logical)

- `id`: uuid
- `frequency`: enum [`daily`, `weekly`, `monthly`]
- `recipients`: string[]
- `interval`: string
- `enabled`: boolean
