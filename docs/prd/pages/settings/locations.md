# Locations

> Route: `/locations` · Nav group: **Settings** · Status: **Draft**

## 1. Summary

- **Locations** manages the venues used for training sessions and matches.
- This is a lightweight reference page; locations are selected when creating sessions or matches.

## 2. Goals / Metrics

### Goals

- Maintain a clean list of venues available to the team.

## 3. Users & Permissions

| Role             | View | Add | Edit | Delete |
| ---------------- | ---- | --- | ---- | ------ |
| GUEST            | No   | No  | No   | No     |
| PLAYER           | No   | No  | No   | No     |
| COACH            | Yes  | No  | No   | No     |
| SUPER_ADMIN      | Yes  | Yes | Yes  | Yes    |
| PLAYER (Captain) | No   | No  | No   | No     |

## 4. UX / Flows

### Entry point

- Sidebar → **Locations**.

### View

- Table lists all locations with name and address.
- Client-side name search.

### Create / Edit

- SUPER_ADMIN sees **+ Add**; clicking it opens a dialog.
- Clicking a row opens the same dialog pre-filled.

## 5. Functional Requirements

- **FR-1:** COACH and SUPER_ADMIN can view locations.
- **FR-2:** Name search filters the list client-side.
- **FR-3:** SUPER_ADMIN can create, edit, and delete locations.
- **FR-4:** Changes show a success or error toast.

## 6. Acceptance Criteria (Given/When/Then)

- **AC-1:** Given I am a COACH, when I open Locations, then I see the list but no add, edit, or delete controls.
- **AC-2:** Given I am SUPER_ADMIN, when I add a location, then it is available in the Training and Matches dialogs.

## 7. Technical Appendix

### Data model (logical)

Location:

- `name`: string
- `address`: string (optional)

### API

- `getLocations()` — fetch all locations
- `upsertLocation(id?, data)` — create or update
- `removeLocation(id)` — delete
