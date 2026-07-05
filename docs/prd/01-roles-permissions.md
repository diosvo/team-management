# Authentication & Authorization

## Auth layers

### Layer 1: Proxy (`proxy.ts`)

Runs on every page navigation (not server actions).

- Checks for a session cookie; if missing, redirects to `/login`.
- If a session cookie is present but the cache is expired, redirects to `/login`.
- Resolves the current pathname to a `Resource` and calls `can(role, resource, 'view')`; if denied, redirects to `/forbidden`.
- **Does not run** for server action requests (`next-action` header) — server actions enforce their own auth.

### Layer 2: `withAuth` / `withResource` (`src/actions/auth.ts`)

The only layer that cannot be bypassed. Runs inside every server action.

- `withAuth` — verifies the session and injects the `user` context into the action.
- `withResource(resource)(actions, fn)` — calls `withAuth`, then checks that the user's ability includes **all** listed actions on the resource via `defineAbility`. Returns `forbidden()` if not.

### Layer 3: Layout / client (`authClient.useSession`)

Proactive client-side UX. Reads the session client-side and controls which UI elements are rendered. Does not enforce security — server is the source of truth.

---

# Roles, Permissions & Glossary

## 1. Roles

| Role          | Description                                                                                      |
| ------------- | ------------------------------------------------------------------------------------------------ |
| `GUEST`       | Read-only access to public team data (dashboard, roster, matches).                               |
| `PLAYER`      | Standard team member. Can view most pages and submit attendance leave requests.                  |
| `COACH`       | Coaching staff. Can manage training sessions, attendance, and matches.                           |
| `SUPER_ADMIN` | Full access to all resources and actions.                                                        |
| Captain       | A `PLAYER` with `is_captain = true`. Inherits PLAYER permissions plus elevated actions (see §2). |

## 2. Permission Matrix

| Resource           | GUEST | PLAYER           | COACH              | SUPER_ADMIN | Captain (extra)      |
| ------------------ | ----- | ---------------- | ------------------ | ----------- | -------------------- |
| `dashboard`        | view  | view             | view               | all         | —                    |
| `team-rule`        | —     | view             | view               | all         | edit                 |
| `roster`           | view  | view             | view               | all         | create, edit, delete |
| `training`         | —     | view             | view, create, edit | all         | —                    |
| `attendance`       | —     | view, create     | view, create, edit | all         | —                    |
| `registration`     | —     | view             | view               | all         | create, edit         |
| `matches`          | view  | view             | view, create, edit | all         | create, edit         |
| `periodic-testing` | —     | view             | view, create, edit | all         | —                    |
| `assets`           | —     | —                | view               | all         | —                    |
| `leagues`          | —     | —                | view               | all         | —                    |
| `locations`        | —     | —                | view               | all         | —                    |
| `profile`          | —     | view, edit (own) | view, edit (own)   | all         | —                    |

> `all` = view, create, edit, delete. Captain permissions are **additive** on top of PLAYER.

## 3. Client-side enforcement

### `usePermissions` hook

Returns the current user's permissions for use in React components:

```ts
const {
  isAdmin,
  isPlayer,
  isCoach,
  isGuest,
  isCaptain,
  can, // (resource, action) => boolean
  canAll, // (Permission[]) => boolean
  canAny, // (Permission[]) => boolean
} = usePermissions();
```

### `Authorized` component

Renders `children` only when `can(resource, action)` is true. Use this to conditionally show action controls (Add, Edit, Delete buttons).

```tsx
<Authorized resource="roster" action="create">
  <AddUserButton />
</Authorized>
```

### `Visibility` component

Renders children visibly or hidden based on any boolean condition (not permission-aware). Use for layout-level show/hide where the check is already done elsewhere.

## 4. Glossary

- **RBAC:** Role-Based Access Control
- **`withResource`:** server-side HOF that enforces `resource:action` permission before executing a server action
- **`withAuth`:** server-side HOF that verifies the session and provides user context
- **Captain flag:** `is_captain` field on the user record; grants additional permissions on top of the PLAYER role
- **Query params:** URL parameters (e.g. `?q=ball&condition=Good`) used to persist filter state
