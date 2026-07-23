# Product Overview — Saigon Rovers Basketball Team Management

> Status: **Draft** · The strategic top of the PRD. Feature-level detail lives in [`features/`](./features/README.md).

## 1. Vision & Problem

Team Management is a web app for managing a basketball club's teams, people, and operations (rosters, schedules, assets) with role-based access.

### Problem

Teams often track key operational info in spreadsheets/chats, causing:

- stale information
- unclear ownership
- poor visibility across roles

### Vision

One private, role-based hub that is the club's single source of truth: any member can answer "who, when, where" in seconds, and the people responsible for a workflow (attendance, registration, testing) can run it end-to-end without leaving the app.

## 2. Personas & Target Users

The role model is small and static; users are trusted club members invited by an admin.

| Persona                | Role flag          | What they need from the app                                                                                    |
| ---------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------- |
| **Visitor / trialist** | `GUEST`            | Read-only look at the club: dashboard, roster, matches.                                                        |
| **Player**             | `PLAYER`           | Check training schedule, team rules, own attendance and performance metrics; keep own profile current.         |
| **Team captain**       | `PLAYER` + Captain | Everything a player has, plus run registration, manage the roster (invite/remove), record matches, edit rules. |
| **Coach**              | `COACH`            | Plan training sessions, take attendance, record match results, track player testing/performance over time.     |
| **Club administrator** | `SUPER_ADMIN`      | Configure teams, leagues, locations; manage all people and data; full access everywhere.                       |

Full capability-by-role detail: [01-roles-permissions](./01-roles-permissions.md).

## 3. Goals & Success Metrics

> Metrics below are proposals — confirm and prune to the 2–3 that matter (see [Open Questions](#11-open-questions)).

| Goal                                             | Signal of success (proposed)                                   |
| ------------------------------------------------ | -------------------------------------------------------------- |
| Replace spreadsheets/chat as the operational hub | Roster, schedule, and match data maintained in-app only        |
| Reliable attendance & performance history        | Attendance recorded for ≥ 90% of training sessions             |
| Self-service answers                             | Members find schedule/roster/rules without asking in chat      |
| Safe delegation                                  | Captains/coaches run their workflows without admin involvement |

## 4. Non-Goals (Out of Scope)

Explicitly not planned without a new product signal — the app targets a trusted, small, single-club portal:

- **Injury/medical tracking, payments/fees, audit logs** — revisit only on real demand.
- **Multi-club / public-facing product** — one club, private portal; opponents are lightweight records, not tenants.
- **Native mobile apps** — responsive web only.
- **Self-service sign-up** — membership is invite-only by design.

## 5. Assumptions & Constraints

- Application is a private team portal; users are trusted team members (invited via email by admin).
- The role set is small and static (`GUEST`, `PLAYER`, `COACH`, `SUPER_ADMIN`, plus the Captain flag).
- Single club with typical team sizes (tens of users, not thousands) — informs performance targets.

## 6. Primary Use Cases (Jobs-to-be-done)

- A player checks team info, training schedule, and performance metrics.
- A coach manages training sessions, attendance, and match records.
- A captain handles registration, manages the roster, and edits team rules.
- An admin manages teams, configuration, and all operational data.

## 7. Feature Map (High-level)

This is a high-level map; details live in the [`Feature Specs`](./features/README.md) docs.

## 8. Product Principles (Shared UX expectations)

- **Role clarity:** users should never wonder why they can/can't do something.
- **Fast search:** lists must support filtering.
- **Safe destructive actions:** deletions require confirmation + clear feedback.
- **Deep-linkable state:** filters should be reflected in the URL where reasonable.

## 9. Shared Requirements (Cross-feature)

### Authorization

- UI may hide controls, but **server must enforce** permissions.

### Filtering & Search State

The **URL is the single source of truth** for search (`q`), pagination (`page`), and filters. Any UI holding local state (the search box, the Advanced Filters drawer draft) is only a _mirror_ of the URL and must follow one two-way contract:

- **Local → URL** on commit (Apply / debounced typing / stat card click).
- **URL → Local** whenever the URL changes from _outside_ that component (card click, back button, reset, deep link) - so mirrors never drift or clobber the URL.

The `URL → Local` resync is centralized in the `useSyncedState` hook; every filter mirror
reuses it rather than re-implementing sync.

```
                 commit (Apply / debounce / card click)
   ┌──────────────────────────────────────────────►┐
LOCAL MIRROR                                       URL
(draft, search box)                       [single source of truth]
   └◄──────────────────────────────────────────────┘
                 resync (useSyncedState) on external change
```

Cases the contract guarantees:

- **Search box** — a card click that sets `q=''` clears the input; stale text can't be
  pushed back into the URL.
- **Advanced Filters drawer** — draft opens from the URL, diverges only locally while
  editing; Apply commits, interact-outside reverts, external URL changes resync the draft.
- **Card click / back button / deep link** — one URL write fans out to every mirror
  (search box + drawer) so the whole page reflects it.

## 10. Non-Functional Requirements

- **Performance:** common pages load quickly for typical team sizes.
- **Accessibility:** keyboard navigation and accessible dialogs.
- **Reliability:** clear loading/error states; avoid duplicate submits.

## 11. Open Questions

- Which 2–3 success metrics in §3 are the ones we actually commit to (and how do we measure them)?
- Which features require audit logs vs. basic activity logging? (Currently a non-goal — see §4.)
