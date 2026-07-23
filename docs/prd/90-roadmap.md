# Roadmap & Release Plan

> Status: **Draft** · High-level direction and priorities. This is not a sprint board — dates are intentionally absent; order implies priority.

## Rollout principles

- Prefer feature flags for larger changes.
- Ship in small increments with backward-compatible data changes.

## Shipped (v1 — current app)

All pages in the [feature catalog](./features/README.md): Dashboard (incl. PDF reports), Team Rule, Roster, Training, Attendance, Registration, Matches, Periodic Testing, Assets, Settings (Teams / Leagues / Locations), Profile.

Recent platform work: Better Auth integration, media storage on Vercel Blob (user images, team logos).

## In progress

_(keep this section to 1–3 items)_

- —

## Planned / Next

- **Documents** (`/documents`) — currently disabled in the sidebar; needs a spec under `features/resources/` plus document-metadata storage.
- **Data-model hardening** — the ⭐ items in [TODO.md](../../TODO.md): jersey-number uniqueness per team, player height/weight bounds, attendance per session.
- **Auth page specs** — `/login`, `/forgot-password`, `/new-password` are undocumented (listed in the feature catalog as gaps).

## Later / Ideas (unprioritized)

- History for generated emails/reports (no DB index today — see TODO.md §3).
- Team membership history (`user_team` table) if transfers or multi-squad become real.
- Per-match lineup / call-up tracking, if registration should feed match-day squads.

## Not planned

See [Non-Goals](./00-overview.md#4-non-goals-out-of-scope): injury/medical tracking, payments, audit logs, multi-club, native apps, self-service sign-up.
