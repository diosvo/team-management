# Assets

> Route: `/assets` · Nav group: **Resources** · Status: **Draft**

## 1. Summary

- **Assets** page lets users view team assets and key metrics.
- Only COACH and SUPER_ADMIN can view the page; only SUPER_ADMIN can add, edit, and delete assets.

## 2. Goals / metrics

### Goals

- Let team staff find an asset by name, category, or condition without scanning the whole list.
- Allow admins to keep inventory accurate from a single dialog.

### Metrics

- Total number of assets.
- Number of assets that need to be replaced (condition `poor`).

## 3. Users and permissions

| Role             | View assets + metrics | Filter | Add | Edit | Bulk delete |
| ---------------- | --------------------- | ------ | --- | ---- | ----------- |
| GUEST            | No                    | No     | No  | No   | No          |
| PLAYER           | No                    | No     | No  | No   | No          |
| COACH            | Yes                   | Yes    | No  | No   | No          |
| SUPER_ADMIN      | Yes                   | Yes    | Yes | Yes  | Yes         |
| PLAYER (Captain) | No                    | No     | No  | No   | No          |

> Captain permissions add nothing on the `assets` resource, so a captain has the same (no) access as any other player.

## 4. UX / flows

### Entry point

- Sidebar → **Assets**

### View and filter

- The Metrics section shows total assets and assets needing replacement. Clicking a metric card filters the list.
- List view shows assets and supports filtering by:
  - name (text)
  - category (select)
  - condition (select)
- Filter state is stored in URL query params.

### Create

- Authorized users see **+ Add**
- Clicking **+ Add** opens a dialog.

### Edit

- SUPER_ADMIN can click an asset row to open the same dialog pre-filled.

### Delete

- Authorized users see a checkbox column.
- Selecting one or more assets enables deletion (popover).

## 5. Functional requirements

### Viewing

- **FR-1:** COACH and SUPER_ADMIN can view the assets list; GUEST, PLAYER, and Captain are redirected to `/forbidden`.
- **FR-2:** The same roles that can view the list can view the asset metrics section.

### Filtering + query params

- **FR-3:** Filter by name, category, and condition.
- **FR-4:** URL reflects filters (query params).
- **FR-5:** Back/forward restores filters from the URL.

### Create/edit

- **FR-6:** Only SUPER_ADMIN can create assets.
- **FR-7:** Only SUPER_ADMIN can edit assets.
- **FR-8:** Asset dialog fields:
  - Required: Name, Quantity
  - Optional: Category (default `equipment`), Condition (default `good`), Note
- **FR-9:** After a successful create or edit, the list and metrics update without a full page refresh.

### Delete

- **FR-10:** Only SUPER_ADMIN can bulk delete assets.
- **FR-11:** Deletion shows success/error toast message.
- **FR-12:** After a successful deletion, the list and metrics update without a full page refresh.

## 6. Acceptance criteria (Given/When/Then)

- **AC-1:** Given I am a COACH, when I open Assets, then I see the list and metrics but no “+ Add” button and no delete checkboxes.
- **AC-2:** Given I am SUPER_ADMIN, when I add an asset with Name and Quantity, then it is created and visible in the list.
- **AC-3:** Given I filter by name “net”, category “Equipment” and condition “Good”, then the URL includes `q=net`, `category=equipment` and `condition=good`.
- **AC-4:** Given I am a COACH, when I attempt to delete assets (UI or API), then the request is rejected.
- **AC-5:** Given I am a GUEST or PLAYER, when I navigate to `/assets`, then I am redirected to `/forbidden`.

## 7. Technical appendix

### Data model (logical)

Asset:

- `name`: string (required)
- `quantity`: integer (default 1)
- `category`: enum [`equipment`, `training`, `others`] (default `equipment`)
- `condition`: enum [`poor`, `fair`, `good`, `obsolete`] (default `good`)
- `note`: string (optional)

### Query params contract

- `q` (string): name search
- `category` (string): category filter value
- `condition` (string): condition filter value
- `page` (number): current page

Example:

- `?q=ball&category=equipment&condition=good&page=1`
