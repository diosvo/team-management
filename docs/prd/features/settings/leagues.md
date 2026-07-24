# Leagues

> Route: `/leagues` · Nav group: **Settings** · Status: **Draft**

## 1. Summary

- **Leagues** manages tournament and competition entries, including the player roster for each.
- Status (Upcoming / Ongoing / Ended) is calculated automatically from dates.

## 2. Goals / Metrics

### Goals

- Let admins register and track the team's league and tournament participations.
- Provide a clean league reference for Matches.

## 3. Users & Permissions

| Role             | View | Add | Edit | Delete |
| ---------------- | ---- | --- | ---- | ------ |
| GUEST            | No   | No  | No   | No     |
| PLAYER           | No   | No  | No   | No     |
| COACH            | Yes  | No  | No   | No     |
| SUPER_ADMIN      | Yes  | Yes | Yes  | Yes\*  |
| PLAYER (Captain) | No   | No  | No   | No     |

\*Delete is restricted to leagues with status **Upcoming**.

## 4. UX / Flows

### Entry point

- Sidebar → **Leagues**.

### View

- Table lists leagues with name, dates, status, and player count.
- Filter by name or status (Upcoming / Ongoing / Ended).

### Create / Edit

- SUPER_ADMIN sees **+ Add**; clicking it opens a dialog.
- Clicking a row opens the same dialog pre-filled.
- The dialog includes a player multi-select to manage the league roster.
- Ongoing and Ended leagues are read-only.

### Delete

- Only leagues with status **Upcoming** can be deleted.

## 5. Functional Requirements

- **FR-1:** COACH and SUPER_ADMIN can view leagues.
- **FR-2:** Filter by name and status; filter state stored in URL.
- **FR-3:** SUPER_ADMIN can create and edit leagues.
- **FR-4:** Status is derived automatically: Upcoming (before start date), Ongoing (between dates), Ended (after end date).
- **FR-5:** The league dialog includes a player picker to sync the roster.
- **FR-6:** Ongoing and Ended leagues cannot be edited or deleted.
- **FR-7:** Deleting an Upcoming league also removes its player associations.
- **FR-8:** Changes show a success or error toast.

## 6. Acceptance Criteria (Given/When/Then)

- **AC-1:** Given I am a COACH, when I open Leagues, then I see the list but no add, edit, or delete controls.
- **AC-2:** Given a league is Ongoing, when SUPER_ADMIN tries to delete it, then the action is rejected.
- **AC-3:** Given I create a league with a start date in the future, then its status is Upcoming.

## 7. Technical Appendix

### Data model (logical)

League:

- `name`: string
- `start_date`: date
- `end_date`: date
- `status`: enum [`UPCOMING`, `ONGOING`, `ENDED`] (computed)
- `players`: many-to-many FK → user

### Query params

- `q` (string): name search
- `status` (string): status filter

### API

- `getLeagues()` — fetch all leagues
- `upsertLeague(id?, data, player_ids)` — create or update + sync roster
- `removeLeague(id)` — delete (Upcoming only)
