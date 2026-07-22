# Page Specs

Docs are organized **by page**, mirroring the app's sidebar navigation
(`SIDEBAR_GROUP` in `src/app/(protected)/_helpers/utils.ts`). Each page has one
spec; its individual functionalities are sections **inside** that spec
(§5 Functional Requirements).

Each spec follows the same template:

- User-facing behavior (readable by end users)
- Requirements + Acceptance Criteria (for engineering/QA)
- Technical appendix (data/API/permissions) if possible.

## Page catalog

| Nav group           | Page             | Route               | Status | Spec                                                  |
| ------------------- | ---------------- | ------------------- | ------ | ----------------------------------------------------- |
| **Overview**        | Dashboard        | `/dashboard`        | Draft  | [dashboard](./overview/dashboard.md)                  |
| **Overview**        | Team Rule        | `/team-rule`        | Draft  | [team-rule](./overview/team-rule.md)                  |
| **Team Management** | Roster           | `/roster`           | Draft  | [roster](./team-management/roster.md)                 |
| **Team Management** | Training         | `/training`         | Draft  | [training](./team-management/training.md)             |
| **Team Management** | Attendance       | `/attendance`       | Draft  | [attendance](./team-management/attendance.md)         |
| **Team Management** | Registration     | `/registration`     | Draft  | [registration](./team-management/registration.md)     |
| **Team Management** | Matches          | `/matches`          | Draft  | [matches](./team-management/matches.md)               |
| **Performance**     | Periodic Testing | `/periodic-testing` | Draft  | [periodic-testing](./performance/periodic-testing.md) |
| **Resources**       | Assets           | `/assets`           | Draft  | [assets](./resources/assets.md)                       |
| **Settings**        | Teams            | `/teams`            | Draft  | [teams](./settings/teams.md)                          |
| **Settings**        | Leagues          | `/leagues`          | Draft  | [leagues](./settings/leagues.md)                      |
| **Settings**        | Locations        | `/locations`        | Draft  | [locations](./settings/locations.md)                  |
| **Account**         | Profile          | `/profile/[id]`     | Draft  | [profile](./profile.md)                               |

> **Dashboard** includes the **PDF Reports** capability (formerly the standalone
> "Analytics Reports" spec) as a functionality under §5.

### Not yet documented

- Auth pages: `/login`, `/forgot-password`, `/new-password`
- Resources → **Documents** (`/documents`, disabled in the sidebar)
