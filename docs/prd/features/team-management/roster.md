# Roster

> Route: `/roster` · Nav group: **Team Management** · Status: **Draft**

## 1. Summary

- **Roster** lists all team members (players, coaches, admins) with their roles and states.
- Admins and Captains can invite new members and remove existing ones; individual profiles are edited at `/profile/[id]`.

## 2. Goals / metrics

### Goals

- Give every member a clear view of who is on the team.
- Let admins and captains manage membership (invite, remove).

## 3. Users and permissions

| Role             | View | Add member | Remove |
| ---------------- | ---- | ---------- | ------ |
| GUEST            | Yes  | No         | No     |
| PLAYER           | Yes  | No         | No     |
| COACH            | Yes  | No         | No     |
| SUPER_ADMIN      | Yes  | Yes        | Yes    |
| PLAYER (Captain) | Yes  | Yes        | Yes    |

> Captains inherit PLAYER permissions plus full roster management (`roster:create`, `edit`, `delete`), the same invite/remove capabilities as SUPER_ADMIN on this page.
> All users can edit their own profile at `/profile/[id]`. SUPER_ADMIN can edit any profile.

## 4. UX / flows

### Entry point

- Sidebar → **Roster**.

### View

- Table lists all members with name, email, role, state, and email verification status.
- Filter by name, email, role, or state.

### Add member

- SUPER_ADMIN and Captain see **+ Add**; clicking it opens an invite dialog.
- The account is created with a temporary password, and a password-setup email (subject “Create a new password”) is sent so the invitee can activate the account. There is no separate email-verification step.

### Remove

- SUPER_ADMIN and Captain can select one or more members and delete them (bulk supported).

## 5. Functional requirements

- **FR-1:** All roles (including GUEST) can view the roster.
- **FR-2:** Filter by name, email, role, and active/inactive state; filter state stored in URL.
- **FR-3:** SUPER_ADMIN and Captain can invite new members.
- **FR-4:** Invite creates the account with a temporary password and triggers a password-reset email through Resend, which the invitee uses to set their own password at `/new-password`.
- **FR-5:** Jersey numbers are unique per team.
- **FR-6:** SUPER_ADMIN and Captain can remove members (bulk delete supported).
- **FR-7:** Changes show a success or error toast.

## 6. Acceptance criteria (Given/When/Then)

- **AC-1:** Given I am a GUEST (or non-captain PLAYER/COACH), when I open Roster, then I see the list but no add or remove controls.
- **AC-2:** Given I am SUPER_ADMIN, when I invite a new player with a duplicate jersey number, then the action is rejected.
- **AC-3:** Given I am SUPER_ADMIN, when I remove a member, then they no longer appear in the roster.
- **AC-4:** Given I am a Captain, when I open Roster, then I see the **+ Add** and remove controls and can invite and remove members like a SUPER_ADMIN.
- **AC-5:** Given I invite a new member, when the invite succeeds, then they receive a “Create a new password” email linking to `/new-password`.

## 7. Technical appendix

### Data model (logical)

User:

- `name`: string
- `email`: string (unique)
- `role`: enum [`player`, `coach`, `super_admin`, `guest`]
- `state`: enum [`active`, `inactive`, `temporarily_absent`, `unknown`]
- `position`: string (player / coach specific)
- `jersey_number`: integer (player only; currently globally unique, see [TODO.md](../../../../TODO.md))
- `email_verified`: boolean

### Query params

- `q` (string): name or email search
- `role` (string): role filter
- `state` (string): active / inactive filter

### API

- `getRoster()`: fetch all members
- `addUser(values)`: invite new member
- `removeUser(id)`: remove member
