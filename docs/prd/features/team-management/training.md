# Training

> Route: `/training` · Nav group: **Team Management** · Status: **Draft**

## 1. Summary

- **Training** lists all scheduled practice sessions with date, time, location, and attendance rate.
- Coaches can create and edit sessions; each session links to the Attendance page for per-session tracking.

## 2. Goals / Metrics

### Goals

- Give the team a clear training schedule.
- Track attendance rates per session.

## 3. Users & Permissions

| Role             | View | Add | Edit | Delete |
| ---------------- | ---- | --- | ---- | ------ |
| GUEST            | No   | No  | No   | No     |
| PLAYER           | Yes  | No  | No   | No     |
| COACH            | Yes  | Yes | Yes  | No     |
| SUPER_ADMIN      | Yes  | Yes | Yes  | Yes    |
| PLAYER (Captain) | Yes  | No  | No   | No     |

## 4. UX / Flows

### Entry point

- Sidebar → **Training**.

### View

- Table lists sessions with date, time, location, status, and attendance rate.
- Filter by location name.
- Stats show total session count.

### Create / Edit

- Authorized users see **+ Add**; clicking it opens a dialog.
- Clicking a row opens the same dialog pre-filled.
- Fields: date, time, location, notes. Coach is auto-assigned (must be Head Coach).

### Attendance link

- Each session row links to the Attendance page filtered to that session's date.

## 5. Functional Requirements

- **FR-1:** PLAYER and above can view the training schedule.
- **FR-2:** Filter by location name; filter state stored in URL.
- **FR-3:** COACH and SUPER_ADMIN can create and edit sessions.
- **FR-4:** A session requires a Head Coach; the coach is auto-assigned from the team.
- **FR-5:** SUPER_ADMIN can delete a session.
- **FR-6:** Each session row shows an attendance rate derived from attendance records.
- **FR-7:** Changes show a success or error toast.

## 6. Acceptance Criteria (Given/When/Then)

- **AC-1:** Given I am a PLAYER, when I open Training, then I see the schedule but no add or edit controls.
- **AC-2:** Given no Head Coach is assigned to the team, when a COACH tries to create a session, then the action is rejected.
- **AC-3:** Given a session exists, when I click the attendance link, then I am taken to Attendance filtered to that date.

## 7. Technical Appendix

### Data model (logical)

Session:

- `coach_id`: FK → user (Head Coach)
- `location_id`: FK → location
- `date`: date
- `time`: time
- `notes`: string (optional)
- `status`: enum [`SCHEDULED`, `COMPLETED`, `CANCELLED`]

### Query params

- `q` (string): location name search

### API

- `getSessions(params)` — fetch schedule
- `upsertSession(id?, values)` — create or update
- `removeSession(id)` — delete
- `getCoach()` — fetch assigned Head Coach
