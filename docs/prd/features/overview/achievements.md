# Achievements

> Route: `/achievements` · Nav group: **Overview** · Status: **Draft**

## 1. Summary

- The **Achievements** page is the club's trophy cabinet: honors grouped by year
  on a vertical timeline, topped by a hero stats strip (total honors,
  championships, podium finishes, years active).
- Because the database only stores our own team's matches, a final league
  placement cannot be computed automatically. Achievements are therefore
  **recorded manually** — but only for leagues that have **ended** (derived from
  `end_date` at read time, since the stored `league.status` can be stale).
- Standalone honors (tournaments, cups not tracked as leagues) are supported by
  leaving the league empty; individual honors (MVP, Top Scorer) reference a
  player.

## 2. Goals / Metrics

### Goals

- Preserve and showcase the club's history in a way that feels prestigious.
- Prompt result entry at the natural moment: when a league ends.
- Keep individual awards grounded in data via auto-suggested candidates.

### Metrics

- Share of ended leagues with at least one recorded achievement.

## 3. Users & Permissions

| Role             | View | Record | Edit | Delete |
| ---------------- | ---- | ------ | ---- | ------ |
| GUEST            | Yes  | No     | No   | No     |
| PLAYER           | Yes  | No     | No   | No     |
| COACH            | Yes  | Yes    | Yes  | No     |
| SUPER_ADMIN      | Yes  | Yes    | Yes  | Yes    |
| PLAYER (Captain) | Yes  | No     | No   | No     |

## 4. UX / Flows

### Entry points

- Sidebar → **Achievements** (Overview group).
- Leagues table → trophy icon on ended rows → `/achievements?record=<league_id>`
  opens the record dialog pre-filled with that league.

### View

- Hero stats strip (`SimpleGrid` of `Stat` cards), then a Chakra `Timeline` with
  one item per year (descending). Each year shows a count badge and achievement
  cards colored by type: Champion (gold), Runner-up (silver), 3rd Place
  (bronze), MVP (purple), Top Scorer (teal), Custom (maroon).
- Empty state: "The trophy cabinet awaits its first honor".

### Record / edit (dialog)

- Fields: type (drives the default title), title, league (**ended leagues
  only**), year (derived from the league's `end_date`, editable only for
  standalone honors), player (required for MVP/Top Scorer), description.
- For MVP/Top Scorer with a league selected, top candidates from
  `match_player_stats` are suggested as one-click chips ("Name — 18.2 ppg").

## 5. Functional Requirements

- **FR-1:** All roles can view the achievements timeline.
- **FR-2:** An achievement tied to a league is accepted only when that league
  has ended — enforced server-side by deriving status from `end_date`
  (`isPast`), not the stored `status` column.
- **FR-3:** A league can hold at most one achievement per type (partial unique
  index), except `CUSTOM` which may repeat.
- **FR-4:** Deleting a league keeps its achievements (`ON DELETE SET NULL`);
  they become standalone honors.
- **FR-5:** Individual honors (MVP, Top Scorer) require a player; team honors
  ignore any player value.

## 6. Data Model

`achievement` table (`src/drizzle/schema/achievement.ts`, migration
`0004_add_achievement_table.sql`):

| Column           | Type                    | Notes                                  |
| ---------------- | ----------------------- | -------------------------------------- |
| `achievement_id` | uuid PK                 |                                        |
| `type`           | `achievement_type` enum | CHAMPION / RUNNER_UP / THIRD_PLACE / MVP / TOP_SCORER / CUSTOM |
| `title`          | varchar(128)            | display title, defaults from the type  |
| `year`           | integer                 | grouping key, derived from league end  |
| `league_id`      | uuid FK → league, null  | `SET NULL` on delete                   |
| `player_id`      | text FK → player, null  | for individual honors                  |
| `description`    | varchar(256), null      |                                        |

## 7. Out of Scope (Phase 2 ideas)

- Photo per achievement (Vercel Blob pattern used for team logos).
- Auto season summary per year (W/L record — needs the `getMatches` home/away
  fix first).
- Public shareable trophy-cabinet page; OG-image year recap.
