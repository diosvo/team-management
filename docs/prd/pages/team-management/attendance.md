# Attendance

> Route: `/attendance` · Nav group: **Team Management** · Status: **Draft**

## 1. Summary

- **Attendance** tracks daily attendance status (On Time, Late, Absent) for all team members.
- Players can submit leave requests; coaches and admins can mark and update statuses.

## 2. Goals / Metrics

### Goals

- Give the team a clear daily attendance picture.
- Allow players to formally request absence in advance.

### Metrics

- Attendance rate (present / total) per session.
- Most common absence reasons (surfaced in the Dashboard).

## 3. Users & Permissions

| Role             | View | Submit leave | Mark / update status | Delete |
| ---------------- | ---- | ------------ | -------------------- | ------ |
| GUEST            | No   | No           | No                   | No     |
| PLAYER           | Yes  | Yes          | No                   | No     |
| COACH            | Yes  | Yes          | Yes                  | No     |
| SUPER_ADMIN      | Yes  | Yes          | Yes                  | Yes    |
| PLAYER (Captain) | Yes  | Yes          | No                   | No     |

## 4. UX / Flows

### Entry point

- Sidebar → **Attendance**.

### View

- The list shows all players with their status for the selected date.
- Filter by player name or status.
- Stats section shows the attendance rate for the date.

### Submit leave

- Players see a **Submit Leave Request** button.
- The form captures date and reason; the status is recorded as Absent.

### Mark / update status

- Coaches and admins see quick-action buttons (On Time, Late, Absent) per row.
- A **Bulk Attendance** dialog allows entering status for multiple players at once.

## 5. Functional Requirements

- **FR-1:** All permitted roles can view the attendance list filtered by date.
- **FR-2:** Filter by player name and status; filter state stored in URL.
- **FR-3:** PLAYER and above can submit a leave request with a reason.
- **FR-4:** COACH and SUPER_ADMIN can mark and update individual statuses.
- **FR-5:** SUPER_ADMIN can bulk-enter attendance for multiple players.
- **FR-6:** Duplicate records for the same player on the same date are prevented.
- **FR-7:** SUPER_ADMIN can delete an attendance record.
- **FR-8:** Changes show a success or error toast.

## 6. Acceptance Criteria (Given/When/Then)

- **AC-1:** Given I am a PLAYER, when I submit a leave request, then an Absent record is created with my reason.
- **AC-2:** Given I am a COACH, when I mark a player On Time, then the status updates immediately.
- **AC-3:** Given a player already has a record for today, when a duplicate is submitted, then it is rejected.

## 7. Technical Appendix

### Data model (logical)

Attendance:

- `player_id`: FK → user
- `date`: date
- `status`: enum [`ON_TIME`, `LATE`, `ABSENT`]
- `reason`: string (optional)

### Query params

- `date` (string): ISO date
- `q` (string): player name search
- `status` (string): status filter

### API

- `getAttendanceByDate(date)` — fetch records and stats
- `submitLeave(values)` — player leave request
- `updateStatus(id, status)` — update a single record
- `removeAttendance(id)` — delete a record
