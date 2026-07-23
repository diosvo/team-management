# Schema Review Checklist

Follow-up items from a review of the data model in `src/drizzle/schema/` (see [02-diagrams.md](./docs/prd/02-diagrams.md) for the full ERD). Each item is a decision to make or a change to schedule — check it off once resolved (fixed, or consciously accepted as-is).

**Suggested priority:** start with the ⭐ items — they reject real-world data or block real scheduling patterns, and they're small migrations now but painful data-repair jobs later.

---

## 1. Needs enhancement (existing relations with real problems)

- [ ] ⭐ **Relax `player` height/weight checks** — `src/drizzle/schema/player.ts`
      `height BETWEEN 0 AND 200` and `weight BETWEEN 0 AND 100` reject a 2.05 m center or a 110 kg player — normal in basketball. Legitimate inserts will fail.
      _Fix: widen bounds (e.g. height ≤ 250, weight ≤ 200) in a migration._

- [ ] **Attendance allows only one record per player per day** — `src/drizzle/schema/attendance.ts`
      The `unique_player_per_date` index blocks taking attendance twice on a two-session day (morning practice + evening scrimmage).
      _Fix: key on `(player_id, session_id)`; keep the date-based uniqueness only for session-less records. Also note `attendance.date` duplicates `training_session.date` when linked — they can silently disagree._

- [ ] ⭐ **`player.jersey_number` is globally unique** — `src/drizzle/schema/player.ts`
      Two players on different teams can't both wear #23. Should be unique per team — but `player` has no `team_id` (it comes via `user`), so the constraint can't currently be expressed. Tied to the membership-history item in section 3.

- [ ] **`asset.name` is globally unique** — `src/drizzle/schema/asset.ts`
      Two teams can't both own a "Ball pump". Scope uniqueness to `(team_id, name)`, the same pattern `test_type` already uses.

- [ ] **`match` has no status** — `src/drizzle/schema/match.ts`
      Scores default to 0, so a scheduled-but-unplayed match is indistinguishable from a 0–0 result. Add a status enum (scheduled / completed / cancelled), mirroring `training_session.status`.

- [ ] **`match.home_team` / `away_team` have no `onDelete` behavior** — `src/drizzle/schema/match.ts`
      Deleting a team with match history throws a raw FK error — the only ungraceful deletion path in the schema. Decide: explicit `restrict` (and a friendly guard in the delete action) or another strategy.

- [ ] **`league_team_roster` doesn't reference `league_team`** — `src/drizzle/schema/league.ts`
      Independent FKs allow registering a player for a `(league, team)` pair never entered into the league, and nothing verifies the player belongs to that team.
      _Fix: composite FK `(league_id, team_id) → league_team`; validate player-team membership in the action layer._

- [ ] **`test_result.date` is nullable** — `src/drizzle/schema/periodic-testing.ts`
      Undated results are useless for trend/progress charts — the main purpose of periodic testing. Make it `NOT NULL` (backfill existing nulls first).

## 2. Simplification candidates (possibly no need)

- [ ] **`league.status` is derivable state** — computable from `start_date`/`end_date`; stored, it goes stale unless curated. Decide: compute at read time, or keep manual and accept the drift.

- [ ] **`attendance.team_id` is redundant** — derivable via `player → user → team_id`, with no consistency guarantee between the two paths. Keep only if it demonstrably helps query performance; otherwise drop.

- [ ] **`rule` as a separate table** — 1:1 with `team`, one text column; could be `team.rule_content`. Only worth keeping separate for future versioned/multiple rules. Low stakes — fine to leave as-is.

## 3. Missing relations (depends on product direction)

- [ ] **Team membership history (biggest structural gap)** — `user.team_id` is a single NOT NULL FK and `join_date`/`leave_date` live on `user`, so a user has exactly one team stint ever. Transfers or leave-and-rejoin lose history, and `match_player_stats` has no team context, so old stats silently attribute to a player's _current_ team.
      _If multi-squad or player movement is realistic: add a `user_team` membership table (user, team, joined, left). If not: current shape is fine and simpler._

- [ ] **Opponent teams are implicit** — opponents live in the `team` table (matches require both sides as rows), distinguished only by not being the `is_default` team, with zero users. Consider an `is_external` flag so opponents don't surface in team-management UIs.

- [ ] **No tables behind `emails`, `documents`, `reports` resources** — the routes and permissions exist (`src/routes.ts`) but there's no email send log, no document metadata, and no registry of generated reports (they go to Blob with no DB index). Needed if those pages should list history.

- [ ] **No per-match lineup / call-up concept** — `match_player_stats` only stores players who accrued stats; there's no "selected but didn't play". Add only if registration/roster is meant to feed match-day squads.

## Explicitly out of scope

Not recommended without a product signal (the PRD frames a trusted, small, single-club portal): injury/medical tracking, payments/fees, audit logs.
