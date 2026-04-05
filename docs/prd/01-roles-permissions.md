# Roles, Permissions & Glossary

## 1. Roles (Definitions)

### GUEST

- Read-only access to view data.

### PLAYER

- Standard team member access.

### COACH

- Staff-level access (typically view + coaching operations).

### SUPER_ADMIN

- Administrative access across the application.

### Captain (PLAYER flag)

A PLAYER with elevated permissions for specific team-level operations.

## 2. Permission Model (General rules)

### 2.1. Server side

Actions are enforced with `withPermissions` → defense-in-depth:

### 2.2. Client (UI) side

Hide actions/ elements with `usePermissions`:

- isAdmin, isCoach, isPlayer, isGuest
- can
- canAll
- canAny

or, `Authorized` component.

### 2.3. Proxy

- Items on sidebar are hidden by permissions.
- Direct URL / API access will be rejected when unauthorized or don't have permissions.

## 3. Glossary

- **RBAC:** Role-Based Access Control
- **Query params:** URL parameters like `?q=ball&condition=Good` used to store filter state.
