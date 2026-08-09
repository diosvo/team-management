# PRD changelog

Revision history of the **documentation itself** (not the app, which is tracked in git history and releases). Add a row for meaningful changes: new/removed specs, scope decisions, status changes. Typo-level edits don't need an entry.

| Date       | Change                                                                                                        |
| ---------- | ------------------------------------------------------------------------------------------------------------- |
| 2026-08-08 | Added ownership checks as `01-roles-permissions` §3 (renumbering the following sections) and documented them per feature: self-only leave (Attendance), self-only profile edits and avatar blob ownership (Profile), the narrowed roster projection that drops personal data from the payload (Roster). Documented per-card streaming and on-demand loading of heavy dependencies (Dashboard, Team Rule, Registration) and the batched result lookup (Periodic Testing). |
| 2026-07-22 | Restructured PRD: master PRD → `00-overview` (added vision, personas, metrics, non-goals), `pages/` → `features/`, added roadmap + this changelog. |
| 2026-07-02 | Reorganized PRD by page; added PDF export via GitHub Actions (#216).                                           |
