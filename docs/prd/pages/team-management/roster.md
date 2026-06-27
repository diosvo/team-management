# Roster

> Route: `/roster` · Nav group: **Team Management** · Status: **Draft**

## 1. Summary

- **Roster** lists all team members (players, coaches, admins) with their roles and states.
- Admins can invite new members and remove existing ones; individual profiles are edited at `/profile/[id]`.

## 2. Goals / Metrics

### Goals

- Give every member a clear view of who is on the team.
- Let admins manage membership (invite, remove).

## 3. Users & Permissions

| Role             | View | Add member | Remove |
| ---------------- | ---- | ---------- | ------ |
| GUEST            | Yes  | No         | No     |
| PLAYER           | Yes  | No         | No     |
| COACH            | Yes  | No         | No     |
| SUPER_ADMIN      | Yes  | Yes        | Yes    |
| PLAYER (Captain) | Yes  | No         | No     |

> All users can edit their own profile at `/profile/[id]`. SUPER_ADMIN can edit any profile.

## 4. UX / Flows

### Entry point

- Sidebar → **Roster**.

### View

- Table lists all members with name, email, role, state, and email verification status.
- Filter by name, email, role, or state.

### Add member

- SUPER_ADMIN sees **+ Add**; clicking it opens an invite dialog.
- A random password is set and a verification email is sent automatically.

### Remove

- SUPER_ADMIN can select one or more members and delete them (bulk supported).

## 5. Functional Requirements

- **FR-1:** All roles (including GUEST) can view the roster.
- **FR-2:** Filter by name, email, role, and active/inactive state; filter state stored in URL.
- **FR-3:** Only SUPER_ADMIN can invite new members.
- **FR-4:** Invite sets a random password and sends a verification email.
- **FR-5:** Jersey numbers are unique per team.
- **FR-6:** Only SUPER_ADMIN can remove members (bulk delete supported).
- **FR-7:** Changes show a success or error toast.

## 6. Acceptance Criteria (Given/When/Then)

- **AC-1:** Given I am a GUEST, when I open Roster, then I see the list but no add or remove controls.
- **AC-2:** Given I am SUPER_ADMIN, when I invite a new player with a duplicate jersey number, then the action is rejected.
- **AC-3:** Given I am SUPER_ADMIN, when I remove a member, then they no longer appear in the roster.

## 7. Technical Appendix

### Data model (logical)

User:

- `name`: string
- `email`: string (unique)
- `role`: enum [`PLAYER`, `COACH`, `SUPER_ADMIN`, `GUEST`]
- `state`: enum [`active`, `inactive`]
- `position`: string (player / coach specific)
- `jersey_number`: integer (player only, unique per team)
- `emailVerified`: boolean

### Query params

- `q` (string): name or email search
- `role` (string): role filter
- `state` (string): active / inactive filter

### API

- `getRoster()` — fetch all members
- `addUser(values)` — invite new member
- `removeUser(id)` — remove member
