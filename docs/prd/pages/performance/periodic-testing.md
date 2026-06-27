# Periodic Testing

> Route: `/periodic-testing` · Nav group: **Performance** · Status: **Draft**
> Sub-routes: `/periodic-testing/test-types`, `/periodic-testing/add-result`

## 1. Summary

- **Periodic Testing** tracks player performance scores across configurable test types (e.g. sprint time, vertical jump) recorded on specific dates.
- Admins can add results in batch and edit scores inline; all other permitted roles can view.

## 2. Goals / Metrics

### Goals

- Give coaches a structured way to track player fitness and performance over time.
- Allow flexible test type configuration to match the team's training program.

### Metrics

- Number of completed test results vs. total expected (players × test types per date).

## 3. Users & Permissions

| Role             | View results | Add result | Manage test types | Edit inline |
| ---------------- | ------------ | ---------- | ----------------- | ----------- |
| GUEST            | No           | No         | No                | No          |
| PLAYER           | Yes          | No         | No                | No          |
| COACH            | Yes          | No         | No                | No          |
| SUPER_ADMIN      | Yes          | Yes        | Yes               | Yes         |
| PLAYER (Captain) | Yes          | No         | No                | No          |

## 4. UX / Flows

### Entry point

- Sidebar → **Periodic Testing**.

### View results

- Results are displayed in a matrix table: rows = players, columns = test types.
- A date selector filters results by testing date.
- Player name search narrows the visible rows.
- Stats section shows completed tests count vs. total players.

### Add result (`/add-result`)

- SUPER_ADMIN is navigated to `/periodic-testing/add-result`.
- A batch form allows entering scores for multiple players in one submission.

### Edit inline

- SUPER_ADMIN can click any score cell to open a popover and update the value.

### Test types (`/test-types`)

- SUPER_ADMIN can create, rename, and delete test types.
- Deleting a test type with existing results is blocked.

## 5. Functional Requirements

### Results view

- **FR-1:** PLAYER, COACH, SUPER_ADMIN, and Captain can view the results matrix.
- **FR-2:** A player name search filters rows; a date selector filters by session date.
- **FR-3:** Stats show completed vs. expected count.

### Add result

- **FR-4:** Only SUPER_ADMIN can access `/add-result`.
- **FR-5:** The batch form saves all submitted scores in one operation.

### Inline edit

- **FR-6:** SUPER_ADMIN can update an individual score via the cell popover.
- **FR-7:** Saving shows a success or error toast.

### Test types

- **FR-8:** Only SUPER_ADMIN can manage test types.
- **FR-9:** Each test type has a name and a unit (e.g. seconds, cm).
- **FR-10:** Deleting a test type that has associated results is rejected.

## 6. Acceptance Criteria (Given/When/Then)

- **AC-1:** Given I am a PLAYER, when I open Periodic Testing, then I see the results matrix but no add or edit controls.
- **AC-2:** Given I am SUPER_ADMIN, when I submit a batch result, then scores are saved and visible in the matrix.
- **AC-3:** Given I am SUPER_ADMIN, when I try to delete a test type with existing results, then the action is rejected with an error message.

## 7. Technical Appendix

### Data model (logical)

TestType:

- `name`: string
- `unit`: string (e.g. `seconds`, `cm`, `reps`)

TestResult:

- `player_id`: FK → user
- `test_type_id`: FK → test_type
- `date`: date
- `result`: numeric score

### Query params

- `date` (string): ISO date for the selected testing session

### API

- `getTestResult(date)` — fetch matrix by date
- `createTestResult(values)` — batch create/update
- `updateTestResultById(id, value)` — single inline update
- `getTestTypes()`, `upsertTestType()`, `removeTestType()` — test type management
