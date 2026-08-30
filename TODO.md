# Schema review checklist

Follow-up items from a review of the data model in `src/drizzle/schema/` (see the [Architecture docs page](content/docs/project/architecture.mdx) for the full ERD). Each item is a decision to make or a change to schedule: check it off once resolved (fixed, or consciously accepted as-is).

**Suggested priority:** start with the ⭐ items. They reject real-world data or block real scheduling patterns, and they're small migrations now but painful data-repair jobs later.

## 1. Needs enhancement (existing relations with real problems)

- [ ] **`test_result.date` is nullable** (`src/drizzle/schema/periodic-testing.ts`)
      Undated results are useless for trend/progress charts, the main purpose of periodic testing. Make it `NOT NULL` (backfill existing nulls first).

## 2. Simplification candidates (possibly no need)

- [x] **`rule` as a separate table**: 1:1 with `team`, one text column; could be `team.rule_content`. Only worth keeping separate for future versioned/multiple rules. Low stakes, fine to leave as-is.
      _Merged in `0017_merge_rule_into_team`._ The table is gone; the document is `team.rule_content`. The editor renders `rule.updated_at` as the document's "last updated", and `team.updated_at` would move whenever the team's name or logo changed — so the merge also adds `team.rule_updated_at`, written only by `upsertRule`. `getRule` narrows the read to those two columns.

## 3. Missing relations (depends on product direction)

- [x] **Team membership history (biggest structural gap)**: `user.team_id` is a single NOT NULL FK and `join_date`/`leave_date` live on `user`, so a user has exactly one team stint ever. Transfers or leave-and-rejoin lose history, and `match_player_stats` has no team context, so old stats silently attribute to a player's _current_ team.
      _Added in `0015_team_membership_history`._ `user_team` holds one row per stint (`user_id`, `team_id`, `join_date`, `leave_date`); `join_date` / `leave_date` moved off `user` and were backfilled into one stint per existing user. A partial unique index (`user_current_team`) allows at most one open stint, and `user_team_stint` blocks starting the same stint twice, so rejoining is legal but duplicating is not. `user.team_id` remains as the pointer to the open stint — every read path filters on it — and `transferMembership` moves the pointer and closes the old stint in one transaction so the two can't disagree. `match_player_stats` gained `team_id`, backfilled from the player's team at migration time.
      Note on the ticket's last line: this does **not** unblock a database-level jersey constraint. Jersey uniqueness per team shipped in `0008` and is enforced in the action layer; with history, uniqueness becomes "per open membership", which a partial unique index still can't express.

- [x] **Opponent teams are implicit**: opponents live in the `team` table (matches require both sides as rows), distinguished only by not being the `is_default` team, with zero users. Consider an `is_external` flag so opponents don't surface in team-management UIs.
      _Added in `0016_flag_external_teams`._ `team.is_external` now marks opponents, and `getTeams` / `updateTeam` / `deleteTeam` filter on it instead of `is_default = false`; `insertTeam` sets it. A `default_team_not_external` check keeps the club's own team out of the opponent set. Backfilled as `NOT is_default`, which is what the flag replaced — deriving it from "has no users" instead would have made any team that does have members invisible in every UI.

- [ ] **No tables behind `emails`, `documents`, `reports` resources**: the routes and permissions exist (`src/routes.ts`) but there's no email send log, no document metadata, and no registry of generated reports (they go to Blob with no DB index). Needed if those pages should list history.

## Explicitly out of scope

Not recommended without a product signal (the PRD frames a trusted, small, single-club portal): injury/medical tracking, payments/fees, audit logs.
