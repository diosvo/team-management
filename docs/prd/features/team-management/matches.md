# Matches

> Route: `/matches` · Nav group: **Team Management** · Status: **Draft**

## 1. Summary

- **Matches** records all team matches (league and friendly), including opponent, score, result, and location.
- Coaches and admins can add and update matches; all permitted roles can view.

## 2. Goals / Metrics

### Goals

- Keep a full history of competitive results.
- Surface win rate and outcome trends for the Dashboard.

### Metrics

- Win / Draw / Loss counts and overall win rate.

## 3. Users & Permissions

| Role             | View | Add | Edit | Delete |
| ---------------- | ---- | --- | ---- | ------ |
| GUEST            | Yes  | No  | No   | No     |
| PLAYER           | Yes  | No  | No   | No     |
| COACH            | Yes  | Yes | Yes  | No     |
| SUPER_ADMIN      | Yes  | Yes | Yes  | Yes    |
| PLAYER (Captain) | Yes  | Yes | Yes  | No     |

## 4. UX / Flows

### Entry point

- Sidebar → **Matches**.

### View

- Table lists all matches with opponent, date, score, result, and match type.
- Filter by opponent name.
- Stats section shows win/draw/loss totals and win rate.

### Create / Edit

- Authorized users see **+ Add**; clicking it opens a dialog.
- Clicking a row opens the same dialog pre-filled.
- Fields: date, opponent, location, league (optional), home/away scores, match type.

### Delete

- Only SUPER_ADMIN can delete a match record.

## 5. Functional Requirements

- **FR-1:** All roles (including GUEST) can view the match list.
- **FR-2:** Filter by opponent name; filter state stored in URL.
- **FR-3:** COACH, SUPER_ADMIN, and Captain can create and edit matches.
- **FR-4:** Match result (WIN / DRAW / LOSS) is derived from scores.
- **FR-5:** League and location are optional references linked from Settings.
- **FR-6:** SUPER_ADMIN can delete a match.
- **FR-7:** Changes show a success or error toast.
- **FR-8:** The list and stats refresh after create, edit, or delete.

## 6. Acceptance Criteria (Given/When/Then)

- **AC-1:** Given I am a GUEST, when I open Matches, then I see the list but no add or edit controls.
- **AC-2:** Given I am a COACH, when I add a match with score 2–1, then the result is WIN and the match appears in the list.
- **AC-3:** Given I am a PLAYER, when I attempt to create a match via the API, then the request is rejected.

## 7. Technical Appendix

### Data model (logical)

Match:

- `opponent_id`: FK → team
- `league_id`: FK → league (optional)
- `location_id`: FK → location (optional)
- `date`: date
- `home_score` / `away_score`: integer
- `result`: enum [`WIN`, `DRAW`, `LOSS`]
- `match_type`: enum [`league`, `friendly`]

### Query params

- `q` (string): opponent name search
- `page` (number): current page

### API

- `getMatches(params)` — fetch list with stats
- `upsertMatch(id?, data)` — create or update
- `removeMatch(id)` — delete
