# Dashboard

> Route: `/dashboard` · Nav group: **Overview** · Status: **Draft**

## 1. Summary

- The **Dashboard** is the default landing page after login (`DEFAULT_LOGIN_REDIRECT`).
- It presents team analytics (charts, key figures) for a selected time `interval`.
- A **PDF Reports** capability lets users export the analytics exactly as rendered on screen (see §5, _PDF Reports_).

## 2. Goals / metrics

### Goals

- Give every role an at-a-glance view of team health and activity.
- Let authorized users export/share the analytics as a print-ready PDF.

### Metrics

- Time to first meaningful render of the dashboard.
- Time to produce a PDF report (render + serve).

## 3. Users and permissions

| Role             | View dashboard | Download PDF |
| ---------------- | -------------- | ------------ |
| GUEST            | Yes            | Yes          |
| PLAYER           | Yes            | Yes          |
| COACH            | Yes            | Yes          |
| SUPER_ADMIN      | Yes            | Yes          |
| PLAYER (Captain) | Yes            | Yes          |

> PDF download requires an active session. Any authenticated user who can view the dashboard can download the report.

## 4. UX / flows

### Entry point

- Sidebar → **Dashboard** (also the post-login redirect).

### View

- Analytics are scoped by an `interval` selector carried in the URL query params.
- Cards appear one at a time: the page shell and the filter row render immediately, and each card swaps its skeleton for content as its own query resolves. A slow query delays only its own card.
- With no data in the selected range, cards show an empty state rather than a placeholder figure. The attendance trend, for example, omits the average-rate line instead of reporting `0.0%` or `NaN%`.

### Export (PDF Reports)

- A “Download report” action posts the current dashboard URL to the report API and streams back a PDF that matches the on-screen analytics for the selected interval.

## 5. Functional requirements

### Analytics view

- **FR-1:** All roles can view the dashboard analytics.
- **FR-2:** The `interval` selector updates the analytics and is reflected in the URL.
- **FR-17:** Each card fetches independently and streams in behind its own loading skeleton; the page does not wait for the slowest query before showing anything.
- **FR-18:** A card with no data in the selected range shows an empty state, not a zero or `NaN` figure.

### PDF Reports

A “Download report” action posts the current dashboard URL to `POST /api/reports/dashboard`, which renders the live page server-side (Puppeteer + Chromium), isolates the analytics grid, and streams the result as a PDF.

#### Architecture

```text
trigger                ┌──────────────────────────────────┐   sink
──────────────         │  POST /api/reports/dashboard      │   ──────────────
manual click  ───────▶ │  puppeteer-core + @sparticuz/     │ ──▶ stream to browser
                       │  chromium → load live dashboard   │
                       │  URL (session cookies forwarded)  │
                       │  → strip DOM to analytics grid    │
                       │  → page.pdf() → Buffer            │
                       └──────────────────────────────────┘
```

- **Why Puppeteer:** the dashboard uses Recharts (client-side SVG), so a real browser render is required for accurate PDF output.
- **Reuses the live dashboard:** the server renders the authenticated dashboard URL directly and strips the DOM to the analytics grid. No separate print route to maintain.
- **Deployment:** `puppeteer-core` + `@sparticuz/chromium` (serverless-compatible); route `maxDuration` set to accommodate Puppeteer cold start.

#### Phase 1: manual download (implemented)

- **FR-3:** A “Download report” action on the Dashboard posts the current `interval` to `POST /api/reports/dashboard`, producing a PDF that reflects the selected time range.
- **FR-4:** The PDF visually matches the on-screen dashboard analytics; the server renders the live page and keeps only the analytics grid (2-column layout).
- **FR-5:** Generation runs entirely server-side; nothing is persisted and no file is written to disk (bytes stream straight to the client).
- **FR-6:** The client shows a loading state during generation and a toast on error.
- **FR-7:** Non-ASCII (Vietnamese) filenames are preserved (RFC 5987 `filename*`).

#### Phase 2: persistence + email _(planned)_

- **FR-8:** Generated PDFs upload to Vercel Blob.
- **FR-9:** Each report writes a metadata row (see Technical Appendix).
- **FR-10:** Downloads are served through an auth-guarded route.
- **FR-11:** A report can be emailed to a recipient list via Resend.

#### Phase 3: scheduling + reports page _(planned)_

- **FR-12:** Users can configure schedules (frequency, recipients, time range).
- **FR-13:** A cron trigger generates due reports using the same engine.
- **FR-14:** A reports page lists history with status, period, and download link.
- **FR-15:** Failed cron runs are recorded with an error and surfaced in the list.
- **FR-16:** A retention policy deletes old Blobs and marks rows `expired`.

## 6. Acceptance criteria (Given/When/Then)

- **AC-1:** Given I am on the Dashboard with `interval=last_month`, when I click “Download report”, then I receive a PDF matching the on-screen analytics for that interval.
- **AC-2:** Given report generation fails, when I click download, then I see an error toast and no file is downloaded.
- **AC-3:** Given an interval with no attendance records, when the attendance trend renders, then the description shows no average rate at all: neither `0.0%` nor `NaN%`.
- **AC-4:** Given one analytics query is slow, when I open the Dashboard, then the other cards render without waiting for it.
- **AC-5:** Given I download a report, when the PDF is produced, then it contains the rendered charts and no loading skeletons.

## 7. Technical appendix

### Rendering: one boundary per card

The page is a Server Component that awaits only the `interval` from the URL. Every card is its own async Server Component (`_components/AnalyticsSections.tsx`) wrapped in its own `<Suspense>`, so the four analytics queries run alongside the overview, sessions, and matches cards, and each card renders as its query resolves. Awaiting them in the page body instead would run the queries one after another and delay the whole response until the last one finished.

That has two consequences:

- **Shared queries run once**: two cards sometimes need the same read. The overview tile and the matches-rate chart both need this year's games; the overview tile and the upcoming-matches card both need upcoming matches. Both reads use React's `cache()` keyed on primitives (`team_id`, `interval`), so parallel cards asking for the same data share one query per request.
- **Charts load client-side**: recharts renders SVG in the browser and dominates the route's client bundle (check with `pnpm analyze`), so each chart is a `next/dynamic` import with `ssr: false` behind a skeleton (`_components/LazyCharts.tsx`) and stays out of first-load JavaScript. The email-report dialog mounts only once opened. The two Quick Actions dialogs are gated to mutually exclusive roles, so a player never downloads the bulk-attendance dialog and an admin never downloads the leave-request one.

### Report API (Phase 1)

- `POST /api/reports/dashboard`: accepts `{ interval, filename }`, launches Chromium, forwards session cookies, renders the live dashboard, strips the DOM to the analytics grid (2 columns), and returns PDF bytes via `page.pdf()`.
- The charts now mount client-side, so the route waits for the dashboard's skeleton placeholders to clear before capturing, on top of waiting for `#reports-dashboard`. That wait is best effort: it caps at 5s and swallows the timeout, because an empty dashboard renders empty states rather than skeletons and must still export.
- Browser is always closed in a `finally` block; no temp file is written.

### Data model: `reports` (Phase 2, logical)

- `id`: uuid
- `created_at`: timestamp
- `period_start` / `period_end`: timestamp
- `trigger`: enum [`manual`, `scheduled`] (the existing `ReportTrigger` in `src/utils/enum.ts`)
- `blob_pathname`: string
- `status`: enum [`success`, `failed`, `expired`]
- `emailed_to`: string[] (nullable)

### Data model: `report_schedules` (Phase 3, logical)

- `id`: uuid
- `frequency`: enum [`daily`, `weekly`, `monthly`]
- `recipients`: string[]
- `interval`: string
- `enabled`: boolean
