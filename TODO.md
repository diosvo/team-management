# Schema review checklist

Follow-up items from a review of the data model in `src/drizzle/schema/` (see the [Architecture docs page](content/docs/project/architecture.mdx) for the full ERD). Each item is a decision to make or a change to schedule: check it off once resolved (fixed, or consciously accepted as-is).

**Suggested priority:** start with the ⭐ items. They reject real-world data or block real scheduling patterns, and they're small migrations now but painful data-repair jobs later.

## 1. Needs enhancement (existing relations with real problems)

- [ ] **`test_result.date` is nullable** (`src/drizzle/schema/periodic-testing.ts`)
      Undated results are useless for trend/progress charts, the main purpose of periodic testing. Make it `NOT NULL` (backfill existing nulls first).
