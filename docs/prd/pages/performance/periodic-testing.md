# Periodic Testing

> Route: `/periodic-testing` · Nav group: **Performance** · Status: **Draft**
> Sub-routes: `/periodic-testing/test-types`, `/periodic-testing/add-result`

## 1. Summary

- **Periodic Testing** tracks player performance scores across configurable test types (e.g. sprint time, vertical jump) recorded on specific dates.
- Results are shown as a player × test-type matrix for a selected date.
- SUPER_ADMIN, COACH, and Captains can add results in batch, edit/delete scores inline, and manage test types; PLAYER and GUEST can only view.

## 2. Goals / Metrics

### Goals

- Give coaches a structured way to track player fitness and performance over time.
- Allow flexible test type configuration to match the team's training program.

### Metrics

- Number of players in the matrix and number of test types recorded per date.

## 3. Users & Permissions

Permissions come from `ROLE_CONFIG` / `CAPTAIN_PERMISSIONS` in
`src/utils/permissions.ts`. SUPER_ADMIN, COACH, and Captains hold the full
`view` / `create` / `edit` / `delete` set on the `periodic-testing` resource.

| Role             | View results | Add result | Manage test types | Edit / delete inline |
| ---------------- | ------------ | ---------- | ----------------- | -------------------- |
| GUEST            | No           | No         | No                | No                   |
| PLAYER           | Yes          | No         | No                | No                   |
| COACH            | Yes          | Yes        | Yes               | Yes                  |
| SUPER_ADMIN      | Yes          | Yes        | Yes               | Yes                  |
| PLAYER (Captain) | Yes          | Yes        | Yes               | Yes                  |

The matrix drives cell editability off the actual ability
(`can('periodic-testing', 'edit')`), so the UI affordance and the server actions
stay in sync for every role.

## 4. UX / Flows

### Entry point

- Sidebar → **Periodic Testing**.
- Editors (SUPER_ADMIN, COACH, Captain) see an **Actions** menu in the header with
  **Add Result** and **Manage Test Types** links (gated by `periodic-testing:create`).

### View results

- Results are displayed in a matrix table: rows = players, columns = test types.
  Each column header shows the test-type name plus its unit, e.g. `Sprint (seconds)`.
- A **date selector** filters results by testing date; the available dates come from
  `getTestDates()`. With **no date selected the matrix is empty** (`getTestResult`
  short-circuits to empty headers/players).
- Changing the date **resets the test-type column filter and pagination**.
- A **player name search** (`q`) filters rows, with matched text highlighted.
- The matrix is **paginated at 10 players per page**.
- Stats section shows two tiles:
  - **Players Joined** — number of players in the matrix.
  - **Completed Tests** — number of test-type columns present for the selected date
    (turns green when > 0). This is a count of recorded test types, not a
    completed-vs-expected ratio.

### Add result (`/add-result`)

- Editors (SUPER_ADMIN, COACH, Captain) can reach `/periodic-testing/add-result`
  (via the Actions menu); access is enforced server-side by `canCreateTestResult()`.
- A batch form allows entering scores for multiple players in one submission.
- Submission is an **upsert**: each `{player, test type, date}` is created if new or
  updated if it already exists; the toast reports `"{N} created, {M} updated"`.

### Edit / delete inline

- Editors modify a score with an **inline click-to-edit field** (Chakra `Editable`,
  not a popover). Clicking a cell reveals a numeric input.
- Committing a value on an **empty cell creates** a result (via `createTestResult`);
  on a populated cell it **updates** it (via `updateTestResultById`).
- **Clearing a populated cell deletes** that result (via `deleteTestResultById`);
  clearing an already-empty cell, or committing an unchanged value, just reverts.
- Saving/deleting shows a loading toast that resolves to success or error; a failed
  operation reverts the draft value.

### Test types (`/test-types`)

- Editors can create, rename, and delete test types.
- Each test type has a name (unique within the team) and a unit.
- Deleting a test type that still has results is **blocked** (see FR-10).

## 5. Functional Requirements

### Results view

- **FR-1:** PLAYER, COACH, SUPER_ADMIN, and Captain can view the results matrix.
- **FR-2:** A player name search filters rows; a date selector filters by session date.
- **FR-3:** Stats show the player count and the number of recorded test types for the date.

### Add result

- **FR-4:** Only editors (SUPER_ADMIN, COACH, Captain) can access `/add-result`.
- **FR-5:** The batch form upserts all submitted scores in one operation (create new,
  update existing).

### Inline edit / delete

- **FR-6:** Editors can create or update an individual score via the inline editable cell.
- **FR-7:** Clearing a populated cell deletes that result.
- **FR-8:** Saving/deleting shows a loading → success/error toast; failures revert the cell.

### Test types

- **FR-9:** Only editors can manage test types.
- **FR-10:** Each test type has a name and a unit from a fixed set
  (`meters`, `percent`, `points`, `reps`, `seconds`, `times`).
- **FR-11:** Deleting a test type that still has results is **blocked**. The
  `test_result.type_id` FK uses `onDelete: 'restrict'`, so the delete raises a foreign
  key violation; `removeTestType` catches constraint
  `test_result_type_id_test_type_type_id_fk` and returns "Type is being in use."

## 6. Acceptance Criteria (Given/When/Then)

- **AC-1:** Given I am a PLAYER (non-captain), when I open Periodic Testing, then I see the results matrix but no add or edit controls.
- **AC-2:** Given I am an editor (SUPER_ADMIN/COACH/Captain), when I submit a batch result, then scores are upserted and visible in the matrix.
- **AC-3:** Given I am an editor, when I clear a populated score cell, then that result is deleted.
- **AC-4:** Given I am an editor, when I try to delete a test type that still has results, then the action is rejected with "Type is being in use."

## 7. Technical Appendix

### Data model (`src/drizzle/schema/periodic-testing.ts`)

TestType (`test_type`):

- `type_id`: uuid PK
- `team_id`: FK → team (cascade on team delete)
- `name`: varchar(64), unique per team
- `unit`: enum `test_type_unit` (`meters` | `percent` | `points` | `reps` | `seconds` | `times`), default `times`
- `created_at`, `updated_at`

TestResult (`test_result`):

- `result_id`: uuid PK
- `player_id`: FK → player (cascade)
- `type_id`: FK → test_type (**restrict** — blocks deleting a type in use)
- `result`: decimal(10, 3)
- `date`: date
- `created_at`, `updated_at`

### Query params

- `date` (string): ISO date for the selected testing session
- `q` (string): player-name search
- `page` (number): matrix pagination
- `type` (string[]): test-type names to show as columns (empty = all). The filtering
  logic is retained in the matrix but the control that set it was removed from the
  filters row in the latest change.

### API (`src/actions/test-result.ts`, `src/actions/test-type.ts`)

- `getTestDates()` — fetch the list of dates that have results (populates the selector)
- `getTestResult(date)` — fetch matrix (`{ headers, players }`) by date; empty when no date
- `createTestResult(values[])` — batch upsert (create or update per player/type/date)
- `updateTestResultById({ result_id, result })` — single inline update
- `deleteTestResultById(result_id)` — single inline delete (clearing a cell)
- `canCreateTestResult()` — permission-check helper
- `getTestTypes()`, `upsertTestType(type_id, data)`, `removeTestType(type_id)` — test type management
