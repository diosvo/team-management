# DEVELOPMENT

## Folder Organization

Ensure consistency and clarity across the codebase, follow these conventions for naming React/Next.js components and their files

Quick Decision Tree

```tree
Is it a...
├─ Database entity/type? → Singular (Asset, Rule)
├─ Component? → Singular + Descriptor (AssetList, RuleForm)
├─ Function fetching many? → Plural (getAssets, getRules)
├─ Function for one item? → Singular (upsertAsset, deleteRule)
├─ URL/Route? → Plural (/assets, /rules)
└─ File name? → Match the primary export (asset.ts, rule.ts)
```

### Database Hierarchy

Match → Schedule → Location/League → Team → Players (Roster)

### Naming Conventions

#### 1️⃣ Entity Names (Singular)

Current entities:

- User (Player | Coach)
- Team
- Asset
- Rule
- Match
- League
- Location
- Schedule
- Periodic Testing
- Attendance
- Training Session

#### 2️⃣ Database/ Schema (Singular)

- Located in `schemas/`

_e.g.,_ AssetTable, UpsertRuleSchema

#### 3️⃣ Components (Singular + Descriptor)

- Located in `_components/` with specific features.
- Use "PascalCase"

_e.g.,_ AssetList, RuleTable

#### 4️⃣ Actions (Context-Based)

- Located in `actions/`.
- Start with verb
- Use "camelCase"

- Fetching mulitple: Use plural (_e.g.,_ getAssets, getRules)
- Single entity operations: Use singular (_e.g.,_ upsertAsset, createRule)

#### Others

STATUS → Lifecycle/Workflow → One-directional progress
├─ LeagueStatus (UPCOMING → ONGOING → COMPLETED)
└─ ScheduleStatus (SCHEDULED → COMPLETED/CANCELLED)

STATE → Condition/Being → Can change in any direction
└─ UserState (ACTIVE ⟷ INACTIVE ⟷ TEMPORARILY_ABSENT)

CONDITION → Physical/Quality state
└─ AssetCondition (POOR/FAIR/GOOD)

## 🖼️ Image Optimization

**Decision: avatars stay on Chakra `Avatar.Image` (plain `<img>`), not `next/image`.**

Why — the current avatar pipeline makes `next/image` a no-op:

- Avatars are stored as **private** Vercel Blobs (`access: 'private'` in `lib/blob.ts`).
- `getFile()` fetches the blob **server-side** and returns a **base64 data URL** (`data:<type>;base64,...`), which flows through `useUserAvatar` into `Avatar.Image` (`AccountMenu`, `ImageUploader`).
- `next/image` cannot optimize `data:` URLs — it passes them through untouched (no resize to `imageSizes`, no WebP/AVIF, `remotePatterns` never applies).

So the images are already fully materialized before they reach the browser; wrapping them in `next/image` adds required `width`/`height` and loses Chakra's `Fallback` layering for **zero optimization gain**. Uploads are also capped at 100 KB and shown at ~32px.

Guidance:

- Use `next/image` for **static/public** assets referenced by a real URL (_e.g._, the header logo via a static import).
- Keep **private, access-controlled** images (avatars) on `Avatar.Image` with base64 data URLs.
- Revisit only if avatars move to **public blobs served by URL** — then `next/image` + `next.config.ts` `images.remotePatterns` become worthwhile (at the cost of the private-access model).

## 📦 Database Interactions

Ensure that PostgresSQL (latest version) is running on your local machine, start it via Homebrew:

```bash
brew services start postgresql@18
```

Generate a new migration after modifying the database schema:

```bash
pnpm db:generate --name <desc>
```

Migrate the database:

```bash
pnpm db:migrate
```

### Rule of Thumb 👍🏻

1. Database relationships

With fields and references - You Own the Foreign Key
Use when: The current table has the foreign key column.
Direction: Many-to-One

If YOUR table has the foreign key column:

```ts
parent: one(ParentTable, {
  fields: [CurrentTable.parent_id],
  references: [ParentTable.id],
});
```

Without fields and references - Other Table Owns the Foreign Key
Use when: The OTHER table has the foreign key pointing to this table.
Direction: One-to-One

// If OTHER table has the foreign key pointing to you:

```ts
child: one(ChildTable); // or many(ChildTable)
```

2. 'use cache' + `cacheTag()`

Use when all 3 conditions are met:

- Stable data — doesn't change on every request (_e.g._, locations, leagues, opponents)
- No/few parameters — avoids cache key explosion
  - getLocations() has zero params ✅
  - getMatches(game_type, interval) has many ❌)
- Clear invalidation — A server action that calls revalidateTag() after every mutation.

## ⭐️ Others

- Check the [snippet directory](https://github.com/chakra-ui/chakra-ui/tree/main/apps/compositions/src/ui) to see Chakra UI changes.

### Badge Variants

Pick by what the value _means_, not by the column:

- `surface` + `colorPalette={getColor(...)}` → **semantic status** where the color carries meaning (status/state/condition/result). _e.g._, attendance status, asset condition, match result.
- `outline`, no `colorPalette` → **neutral labels** that classify but aren't good/bad (role, position).
- `surface` + fixed color → **UI accents** not driven by data (_e.g._, "TODAY", "N selected").
