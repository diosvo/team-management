# Profile

> Route: `/profile/[id]` · Nav group: **Account** (not in sidebar) · Status: **Draft**

## 1. Summary

- **Profile** shows a single member's details across three tabs: **Overview** (avatar), **Personal**, and **Team**.
- Reached from the **Account Menu → Profile** (your own profile) or by clicking a member row in **Roster** (any member).
- Members edit their own profile; SUPER_ADMIN can edit anyone's; GUEST has no access.

## 2. Goals / Metrics

### Goals

- Give each member a single place to review and maintain their own details.
- Let admins manage any member's team-facing data (role, position, state, jersey number).
- Keep avatars private, lightweight, and easy to update.

## 3. Users & Permissions

Backed by the `profile` resource.

| Role        | View own | Edit own     | View others | Edit others |
| ----------- | -------- | ------------ | ----------- | ----------- |
| GUEST       | No       | No           | No          | No          |
| PLAYER      | Yes      | Yes          | Yes         | No          |
| COACH       | Yes      | Yes          | Yes         | No          |
| SUPER_ADMIN | Yes      | Avatar only¹ | Yes         | Yes         |

> ¹ On their **own** profile, SUPER_ADMIN sees the Personal/Team tabs as **read-only** (the edit action is disabled); admins manage their own team data by editing another admin or via Roster. They can still upload their own avatar.
> GUEST is redirected away (`forbidden`) — the profile page is not viewable.

### `viewOnly` rules

The page computes a `viewOnly` flag that disables the **Edit** action on the Personal and Team tabs:

- SUPER_ADMIN on **own** profile → `viewOnly = true`
- SUPER_ADMIN on **another** profile → editable
- PLAYER / COACH on **own** profile → editable
- PLAYER / COACH on **another** profile → `viewOnly = true`

Avatar upload is gated separately: only the **profile owner** can change the avatar (any role, own profile only).

## 4. UX / Flows

### Entry points

- **Account Menu → Profile** — opens your own profile.
- **Roster** — clicking a member row opens that member's profile.

### Layout

- Tabbed layout, centered; tabs are vertical on desktop and horizontal on mobile.
- Tabs: **Overview**, **Personal**, **Team**. A "Last updated on …" timestamp shows below.

### Overview (avatar)

- Shows the member's avatar (or initials fallback) with name and role.
- On your own profile, hovering the avatar reveals a camera overlay; clicking it opens a file picker.
- Accepts image files up to **1 MB**; the new avatar is stored privately and the old one is removed.
- A loading toast turns into success/error; on success the avatar and the current session update immediately.

### Personal

- View mode shows Email, Fullname, DOB, Phone Number, Citizen ID (unset fields show `-`).
- Edit mode exposes inputs; **Email is read-only**. Save is enabled only when the form is valid and changed.
- Cancel discards edits and returns to view mode.

### Team

- View mode shows Role, Position, State, Jersey Number, and Joined date.
- Edit mode exposes State, Jersey Number (players), and Join Date.
- **SUPER_ADMIN** additionally edits Role and Position.
- Activating a member (state → active) refreshes the active-players cache.

## 5. Functional Requirements

- **FR-1:** GUEST cannot access any profile; all other roles can view any profile.
- **FR-2:** A member can edit their own Personal and Team info; SUPER_ADMIN can edit any member's (except their own, which is read-only).
- **FR-3:** Only the profile owner can upload/replace the avatar.
- **FR-4:** Avatars accept image files up to 1 MB, are stored privately, and replace the previous file.
- **FR-5:** Email is read-only in the Personal tab.
- **FR-6:** Fullname is required (min 6 chars); Phone must be 10 digits; Citizen ID must be 12 digits when provided.
- **FR-7:** Jersey numbers are unique per team; a duplicate is rejected with a clear message.
- **FR-8:** Only SUPER_ADMIN can change a member's Role and Position.
- **FR-9:** Save actions show a success or error toast; a failed save does not exit edit mode.
- **FR-10:** The page shows when the profile was last updated.

## 6. Acceptance Criteria (Given/When/Then)

- **AC-1:** Given I am a PLAYER, when I open my own profile, then I can edit my Personal and Team info.
- **AC-2:** Given I am a PLAYER, when I open another member's profile, then all fields are read-only.
- **AC-3:** Given I am SUPER_ADMIN, when I open another member's profile, then I can edit their Role, Position, State, and Jersey Number.
- **AC-4:** Given I am SUPER_ADMIN, when I open my own profile, then the Personal and Team tabs are read-only but I can still upload my avatar.
- **AC-5:** Given I edit a player and enter a jersey number already used on the team, then the save is rejected with "Jersey number '<n>' is already taken".
- **AC-6:** Given I upload an avatar over 1 MB, then it is rejected before upload.
- **AC-7:** Given I upload a valid avatar on my own profile, then the avatar updates, the previous file is removed, and the session reflects the new image.
- **AC-8:** Given I am a GUEST, when I navigate to a profile URL, then I am blocked (forbidden).

## 7. Technical Appendix

### Data model (logical)

User:

- `name`: string (min 6)
- `email`: string (unique, read-only here)
- `dob`: date
- `phone_number`: string (10 digits, optional)
- `citizen_identification`: string (12 digits, optional)
- `image`: string — private blob pathname of the avatar (nullable)
- `role`: enum [`PLAYER`, `COACH`, `SUPER_ADMIN`, `GUEST`]
- `state`: enum [`active`, `inactive`]
- `join_date`: date

Player: `position`, `jersey_number` (unique per team) · Coach: `position`.

### Avatar storage

- Stored in **Vercel Blob** with `access: 'private'` and a random suffix; served to the client as a base64 data URL.
- Path convention: `users/<user_id>`.
- Uploading replaces the record's `image` and deletes the previous blob.

### API (server actions)

- `getUserProfile(id)` — returns `{ targetUser, viewOnly }`; `notFound()` if missing, `forbidden()` for GUEST.
- `getAvatar(image_path)` — resolves a private blob path to a data URL (`null` when unset).
- `uploadAvatar(user_id, old_path, file)` — uploads, updates `image`, removes the old blob, returns `{ image }`.
- `updatePersonalInfo(user_id, values)` — updates name/dob/phone/citizen ID.
- `updateTeamInfo(user_id, values)` — updates user + role-specific (player/coach) data.

### Client data

- `useUserAvatar(image)` — SWR-immutable fetch of the avatar data URL, keyed on the image path.
