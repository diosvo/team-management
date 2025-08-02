# Branch

Checkk out branch from `main` with format:

```bash
git checkout -b dev_<ticket_number>
```

# Component and File Naming Convention

To ensure consistency and clarity across the codebase, follow these conventions for naming React/Next.js components and their files:

## 1. File Naming

- Use lowercase and hyphen for filenames (e.g., `user-list.tsx`).
- Base file names on the component's purpose or type. Common base names include:
  - `list` (e.g., `PlayerList.tsx`)
  - `table` (e.g., `TeamStatsTable.tsx`)
  - `filters` (e.g., `UserFilters.tsx`)
  - `upsert` (e.g., `AssetUpsert.tsx`)
  - `form`, `card`, `modal`, etc.
- Use plural for collections (e.g., `filters`, `stats`).

## 2. Component Naming

- Component names should be PascalCase and clearly indicate their function and the entity they affect.
- Use the pattern `[Entity][Type]` or `[Entity][Action][Type]` for clarity. Examples:
  - `PlayerList`, `UserProfileCard`, `TeamStatsTable`, `AssetUpsertForm`
  - For UI elements: `PageTitle`, `TextField`, `Stats`, `Pagination`, `Loading`, `Visibility`, `TextEditor`
- If a component is generic or utility, use a descriptive name (e.g., `Visibility`, `TextEditor`).
- For components that wrap or enhance UI primitives, use names that reflect their intent (e.g., `PageTitle` for a styled heading, `TextField` for a labeled field).

## 3. Function Naming

- Functions should be named to reflect their action and the entity they affect, e.g., `fetchUserList`, `updatePlayerStats`, `handleAssetUpsert`.

## 4. Examples from `/src/components`

- `PageTitle` (file: `page-title.tsx`): Renders a styled heading with a squiggle underline.
- `Pagination` (file: `pagination.tsx`): Handles paginated navigation for lists/tables.
- `Stats` (file: `stats.tsx`): Displays a grid of statistical cards.
- `TextEditor` (file: `text-editor.tsx`): Rich text editor with formatting controls.
- `TextField` (file: `text-field.tsx`): Labeled field for displaying text or values.
- `Visibility` (file: `visibility.tsx`): Conditionally renders children based on visibility.
- `Loading` (file: `loading.tsx`): Shows a loading progress bar.

## 5. General Guidelines

- Always use meaningful, descriptive names that reflect the component's or function's purpose.
- Avoid abbreviations unless they are widely understood.
- Keep names concise but explicit about their intent and affected entity.
