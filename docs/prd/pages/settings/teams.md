# Teams

> Route: `/teams` · Nav group: **Settings** · Status: **Draft**

## 1. Summary

- **Teams** manages the directory of **opponent** teams used across the app (primarily as home/away teams in Matches).
- Each entry captures a name, optional contact email, establishment year, and optional logo.
- The app's own **default team** is hidden here and cannot be edited or deleted from this page.

## 2. Goals / Metrics

### Goals

- Give admins a single place to register and maintain opponent teams.
- Provide a clean team reference for Matches (home / away selection).

## 3. Users & Permissions

| Role             | View | Add | Edit | Delete |
| ---------------- | ---- | --- | ---- | ------ |
| GUEST            | No   | No  | No   | No     |
| PLAYER           | Yes  | No  | No   | No     |
| COACH            | Yes  | No  | No   | No     |
| SUPER_ADMIN      | Yes  | Yes | Yes  | Yes    |
| PLAYER (Captain) | Yes  | No  | No   | No     |

> COACH has read-only access. SUPER_ADMIN has full control.

## 4. UX / Flows

### Entry point

- Sidebar → **Teams**.

### View

- Table lists opponent teams with name, email, established year, and last updated.
- Filter by free-text search over name or email (search box).
- Rows are sorted alphabetically by name.

### Create / Edit

- SUPER_ADMIN sees **+ Add**; clicking it opens a dialog.
- SUPER_ADMIN can click a row to open the same dialog pre-filled for editing.
- Fields: **Name** (required), **Email** (optional), **Establish Year** (defaults to the current year), **Logo URL** (optional).

### Delete

- SUPER_ADMIN can select one or more teams and delete them (bulk supported).
- A summary toast reports how many were deleted and surfaces any failures.

## 5. Functional Requirements

- **FR-1:** COACH and SUPER_ADMIN can view teams; the list excludes the default team.
- **FR-2:** Filter by name or email; search state stored in the URL (`q`).
- **FR-3:** SUPER_ADMIN can create and edit teams.
- **FR-4:** Name is 3–128 characters. Email, when provided, must be a valid address and is unique across teams. Establish year is between 2000 and the current year (defaults to the current year). Logo URL, when provided, must be a valid URL.
- **FR-5:** SUPER_ADMIN can delete teams, including bulk delete.
- **FR-6:** The default team cannot be updated or deleted from this page.
- **FR-7:** Changes show a success or error toast; bulk delete reports partial failures.

## 6. Acceptance Criteria (Given/When/Then)

- **AC-1:** Given I am a COACH, when I open Teams, then I see the list but no add, edit, or delete controls.
- **AC-2:** Given I am SUPER_ADMIN, when I add a team with an email already used by another team, then the action is rejected with an error toast.
- **AC-3:** Given I am SUPER_ADMIN, when I select multiple teams and delete them, then a toast reports how many were deleted and any failures.
- **AC-4:** Given I am a PLAYER or GUEST, when I navigate to `/teams`, then I have no access to the page.

## 7. Technical Appendix

### Data model (logical)

Team:

- `team_id`: uuid (PK)
- `is_default`: boolean (the app's own team; hidden from this page)
- `name`: string (3–128)
- `email`: string (unique, optional)
- `establish_year`: integer (2000 – current year, default current year)
- `logo_url`: string (optional, valid URL)
- `updated_at`: timestamp

### Query params

- `q` (string): name or email search
- `page` (number): pagination

### API

- `getTeams()` — fetch all opponent teams (excludes the default team)
- `upsertTeam(team_id?, data)` — create or update a team
- `removeTeam(team_id)` — delete a team
