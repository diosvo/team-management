# Feature Spec 05 — Assets

## 1. Summary

- **Assets** page lets users view team assets and key metrics.
- Specific-roles (SUPER_ADMIN and Captain) can add, edit, and delete assets.

## 2. Goals / Metrics

### Goals

- Users can find assets quickly by name/ condition.
- Captains/admins can keep inventory accurate with minimal effort.

### Metrics

- The total number of assets.
- The number of assets need to be replaced (condition = “Poor”).

## 3. Users & Permissions

| Role             | View assets + metrics | Filter | Add  | Edit | Bulk delete |
| ---------------- | --------------------- | ------ | ---- | ---- | ----------- |
| GUEST            | Yes                   | Yes    | No   | No   | No          |
| PLAYER           | Yes                   | Yes    | No\* | No\* | No\*        |
| COACH            | Yes                   | Yes    | No   | No   | No          |
| SUPER_ADMIN      | Yes                   | Yes    | Yes  | Yes  | Yes         |
| PLAYER (Captain) | Yes                   | Yes    | Yes  | Yes  | Yes         |

\*Captain is a subset of PLAYER.

## 4. UX / Flows

### Entry point

- Sidebar → **Assets**

### View & filter

- Metrics section shows total assets and assets needing replacement. Click on metric filters the list.
- List view shows assets and supports filtering by:
  - name (text)
  - category (select)
  - condition (select)
- Filter state is stored in URL query params.

### Create

- Authorized users see **+ Add**
- Clicking **+ Add** opens a dialog.

### Edit

- Non-guest users can click an asset row to open the same dialog with its data.

### Delete

- Authorized users see a checkbox column.
- Selecting one or more assets enables deletion (popover).

## 5. Functional Requirements

### Viewing

- **FR-1:** All roles can view assets list.
- **FR-2:** All roles can view asset metrics section.

### Filtering + query params

- **FR-3:** Filter by name, category, and condition.
- **FR-4:** URL reflects filters (query params).
- **FR-5:** Back/forward restores filters from the URL.

### Create/edit

- **FR-6:** Only SUPER_ADMIN and Captain can create assets.
- **FR-7:** Only SUPER_ADMIN and Captain can edit assets.
- **FR-8:** Asset dialog fields:
  - Required: Name, Quantity
  - Optional: Category (default=Equipment), Condition (default=Good), Note
- **FR-9:** After a successful create or edit, the list and metrics update without a full page refresh.

### Delete

- **FR-10:** Only SUPER_ADMIN and Captain can bulk delete assets.
- **FR-11:** Deletion shows success/error toast message.
- **FR-12:** After a successful deletion, the list and metrics update without a full page refresh.

## 6. Acceptance Criteria (Given/When/Then)

- **AC-1:** Given I am a GUEST, when I open Assets, then I do not see “+ Add” or delete checkboxes.
- **AC-2:** Given I am a Captain, when I add an asset with Name and Quantity, then it is created and visible in the list.
- **AC-3:** Given I filter by name "net", category "Equipment" and condition "Good", then the URL includes `q=net`, `category=EQUIPMENT` and `condition=GOOD`.
- **AC-4:** Given I am a COACH, when I attempt to delete assets (UI or API), then the request is rejected.

## 7. Technical Appendix

### Data model (logical)

Asset:

- `name`: string (required)
- `quantity`: integer (default 1)
- `category`: enum [default "Equipment", "Training", "Others"]
- `condition`: enum [default "Good", "Fair", "Poor"]
- `note`: string (optional)

### Query params contract

- `q` (string): name search
- `category` (string): category filter value
- `condition` (string): condition filter value
- `page` (number): current page

Example:

- `?q=ball&category=EQUIPMENT&condition=GOOD&page=1`
