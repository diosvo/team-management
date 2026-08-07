# Matches

> Route: `/matches` · Nav group: **Team Management** · Status: **Draft**

## 1. Summary

- **Matches** records all team matches (league and friendly), including opponent, score, result, and location.
- Coaches and admins can add and update matches; all permitted roles can view.

## 2. Goals / metrics

### Goals

- Keep a full history of competitive results.
- Surface win rate and outcome trends for the Dashboard.

### Metrics

- Win / Draw / Loss counts and overall win rate.

## 3. Users and permissions

| Role             | View | Add | Edit | Delete |
| ---------------- | ---- | --- | ---- | ------ |
| GUEST            | Yes  | No  | No   | No     |
| PLAYER           | Yes  | No  | No   | No     |
| COACH            | Yes  | Yes | Yes  | No     |
| SUPER_ADMIN      | Yes  | Yes | Yes  | Yes    |
| PLAYER (Captain) | Yes  | Yes | Yes  | No     |

## 4. UX / flows

### Entry point

- Sidebar → **Matches**.

### View

- Table lists all matches with opponent, date, score, result, and match type.
- Filter by opponent name.
- Stats section shows win/draw/loss totals and win rate.

### Create / edit

- Authorized users see **+ Add**; clicking it opens a dialog.
- Clicking a row opens the same dialog pre-filled.
- Fields: date, time, home team, away team, location, league (optional; leaving it blank makes the match a friendly), home/away scores, and format (5x5 or 3x3).

### Delete

- Only SUPER_ADMIN can delete a match record.

## 5. Functional requirements

- **FR-1:** All roles (including GUEST) can view the match list.
- **FR-2:** Filter by opponent name; filter state stored in URL.
- **FR-3:** COACH, SUPER_ADMIN, and Captain can create and edit matches.
- **FR-4:** Match result (win / draw / loss) is derived from the two scores at read time; it is not a stored column.
- **FR-5:** League and location are optional references linked from Settings. A match with no league is a friendly.
- **FR-6:** Home team and away team must be different teams.
- **FR-7:** SUPER_ADMIN can delete a match.
- **FR-8:** Changes show a success or error toast.
- **FR-9:** The list and stats refresh after create, edit, or delete.

## 6. Acceptance criteria (Given/When/Then)

- **AC-1:** Given I am a GUEST, when I open Matches, then I see the list but no add or edit controls.
- **AC-2:** Given I am a COACH, when I add a match where our team scores 78 against the opponent's 65, then the result reads win and the match appears in the list.
- **AC-3:** Given I am a PLAYER, when I attempt to create a match via the API, then the request is rejected.
- **AC-4:** Given I select the same team as both home and away, then the save is rejected by the `diff_team` check.

## 7. Technical appendix

### Data model (`src/drizzle/schema/match.ts`)

Match (`match`):

- `match_id`: uuid PK
- `is_5x5`: boolean (true = 5x5, false = 3x3)
- `league_id`: FK → league, nullable (null means a friendly match)
- `location_id`: FK → location, nullable
- `home_team` / `away_team`: FK → team, both required; a `diff_team` check enforces that they differ
- `date`: date · `time`: time
- `home_team_score` / `away_team_score`: integer, default 0

There is no `result` column and no match status column: the win/draw/loss badge is computed from the two scores. Because scores default to 0, a scheduled-but-unplayed match currently looks like a 0–0 draw (tracked in [TODO.md](../../../../TODO.md)).

MatchPlayerStats (`match_player_stats`): per-player box score keyed on `(match_id, player_id)`, holding points scored, rebounds, assists, steals, blocks, turnovers, fouls, and minutes played.

### Query params

- `q` (string): opponent name search
- `page` (number): current page

### API

- `getMatches(params)`: fetch list with stats
- `upsertMatch(id?, data)`: create or update
- `removeMatch(id)`: delete
