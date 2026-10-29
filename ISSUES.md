# Issues found during the docs refactor (2026-09-30)

Each issue below was found while verifying the docs against the source code.
Issues 1–6 are fixed on branch `docs/fumadocs-refactor-i18n`, one commit each;
the matching docs page describes the fixed behaviour. Issues 7–11 are open.

## Fixed

### 1. Captains cannot save the team rule — fixed in f4fabe96

`upsertRule` requires `create` **and** `edit` (`withResource` uses `canAll`),
but `CAPTAIN_PERMISSIONS` grants only `team-rule:edit`. The Edit button renders
for a Captain, the save returns `forbidden()`.
Fix: gate on `['edit']`; the rule is a per-team singleton created lazily.
Files: `src/actions/rule.ts`, `src/actions/rule.test.ts`.
Docs: `content/docs/features/team-rule(.vi).mdx` Access callout.

### 2. Dashboard PDF ignores the selected interval — fixed in 427b3012

`POST /api/reports/dashboard` navigates Chromium to the request origin, which
the proxy redirects to `/dashboard` with the default interval. `period` only
labels the PDF; the charts always show `this_year`.
Fix: client posts `interval`; the route validates it against `INTERVAL_VALUES`
and opens `/dashboard?interval=…`.
Files: `src/app/api/reports/dashboard/route.ts` (+ test),
`src/app/(protected)/(overview)/dashboard/_components/DashboardFilters.tsx` (+ test).
Docs: `content/docs/features/dashboard(.vi).mdx` report callout, payload shape.

### 3. Achievements ignores `?record=<league_id>` — fixed in 4bd22bc3

The Leagues table links to `/achievements?record=<league_id>`, but the page
never reads `record`, so the dialog is not pre-filled.
Fix: `AchievementHeader` reads the param and opens the dialog with `league_id`
for users holding `achievements:create`.
Files: `src/app/(protected)/(overview)/achievements/_components/AchievementHeader.tsx` (+ test).
Docs: `content/docs/features/achievements(.vi).mdx` acceptance accordion.

### 4. Coach cannot reach attendance marking; bulk footer copy is wrong — fixed in 1153926e

**Mark Attendance** and the row checkboxes are gated on `isAdmin`, although
COACH holds `attendance:edit` and the server accepts it. The bulk dialog footer
says "the remaining players will be marked on time" even though only the
selected rows are submitted once any player is selected.
Fix: gate on `can('attendance', 'edit')`; footer text reflects both cases.
Files: `AttendanceHeader.tsx`, `AttendanceTable.tsx`, `BulkAttendanceManager.tsx`
(+ tests) under `src/app/(protected)/(team-management)/attendance/_components/`.
Docs: `content/docs/features/team-management/attendance(.vi).mdx` Access section.

### 5. League read-only rule is client-side only — fixed in 2c8eeaab

`upsertLeague` and `removeLeague` never check the league status; only the
dialog and row selection stop edits to ongoing/ended leagues. `removeLeague`
also reports "Failed to delete asset", and `UpsertLeagueSchema` carries a
`location_id` field with no column behind it.
Fix: re-derive status via `getLeagueById` and reject non-upcoming leagues with
"Only upcoming leagues can be changed"; fix the copy; drop `location_id`.
Files: `src/actions/league.ts` (+ test), `src/schemas/league.ts`.
Docs: `content/docs/features/settings/leagues(.vi).mdx` Rules section.

### 6. GUEST can open the match update dialog — fixed in 950536a1

`MatchTable` opens `UpsertMatch` on row click for every role; `SessionTable`
guards this with `isGuest`. The server still rejects the save.
Fix: mirror the `isGuest ? undefined : …` guard.
Files: `src/app/(protected)/(team-management)/matches/_components/MatchTable.tsx` (+ test).
Docs: `content/docs/features/team-management/matches(.vi).mdx` acceptance accordion.

## Open, not fixed

### 7. `getActivePlayers` ships personal data to every member

Registration loads full `User` rows (date of birth, phone, citizen ID) for any
signed-in member, unlike Roster's narrowed `RosterUser` projection.
Suggested: a narrow projection for the registration picker; PDF export can
fetch the full fields server-side for the selected players only.

### 8. `getAchievements` has no team scoping

`achievement` has no `team_id`, so the action returns every row. Fine for a
single-club deployment; revisit if opponents ever become tenants.

### 9. Test-type unit default differs by layer

The form defaults `unit` to `seconds`, the `test_type.unit` column defaults to
`times`.

### 10. Playwright workflow uploads the wrong folder

`.github/workflows/playwright.yaml` uploads `playwright-report/` while
`playwright.config.ts` writes `playwright/report`. The job is currently
disabled (`if: false`), so this only matters once it is re-enabled.

### 11. `is_captain` source of truth

`src/lib/auth.ts` declares `is_captain` as a Better Auth `user` additional
field and `withResource` / `usePermissions` read it from the session user, but
the only `is_captain` column is on `player`. Confirm how the session flag is
populated before relying on it in new code.
