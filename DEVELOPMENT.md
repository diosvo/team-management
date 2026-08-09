# Development guide

Conventions for working in this repo: how to name entities, components, and actions; when `next/image` is worth reaching for; how to run and change the database; and which Chakra badge variant fits a given value. For the system design, see [ARCHITECTURE.md](ARCHITECTURE.md).

## Folder organization

To keep the codebase consistent and clear, follow these conventions when naming React/Next.js components and their files.

Decision tree:

```tree
Is it a...
├─ Database entity/type? → Singular (Asset, Rule)
├─ Component? → Singular + Descriptor (AssetList, RuleForm)
├─ Function fetching many? → Plural (getAssets, getRules)
├─ Function for one item? → Singular (upsertAsset, deleteRule)
├─ URL/Route? → Plural (/assets, /rules)
└─ File name? → Match the primary export (asset.ts, rule.ts)
```

### Database hierarchy

Match → Schedule → Location/League → Team → Players (Roster)

### Naming conventions

#### 1️⃣ Entity names (singular)

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

#### 2️⃣ Database and schema (singular)

- Located in `schemas/`

_e.g.,_ AssetTable, UpsertRuleSchema

#### 3️⃣ Components (singular + descriptor)

- Located in `_components/` with specific features
- Use `PascalCase`

_e.g.,_ AssetList, RuleTable

#### 4️⃣ Actions (context-based)

- Located in `actions/`
- Start with a verb
- Use `camelCase`
- Fetching multiple: use plural (_e.g.,_ getAssets, getRules)
- Single entity operations: use singular (_e.g.,_ upsertAsset, createRule)

#### Suffix meanings

Enum values are lowercase (`src/utils/enum.ts`); the suffix tells you how a value is allowed to move:

```text
STATUS → Lifecycle/Workflow → One-directional progress
├─ LeagueStatus (upcoming → ongoing → ended)
└─ SessionStatus (scheduled → active → completed/cancelled)

STATE → Condition/Being → Can change in any direction
└─ UserState (active ⟷ inactive ⟷ temporarily_absent ⟷ unknown)

CONDITION → Physical/Quality state
└─ AssetCondition (poor/fair/good/obsolete)
```

## 🖼️ Image optimization

**Decision: avatars stay on Chakra `Avatar.Image` (plain `<img>`), not `next/image`.**

The current avatar pipeline makes `next/image` a no-op:

- Avatars are stored as **private** Vercel Blobs (`access: 'private'` in `lib/blob.ts`).
- `getFile()` fetches the blob **server-side** and returns a **base64 data URL** (`data:<type>;base64,...`), which flows through `useUserAvatar` into `Avatar.Image` (`AccountMenu`, `ImageUploader`).
- `next/image` cannot optimize `data:` URLs, so it passes them through untouched (no resize to `imageSizes`, no WebP/AVIF, `remotePatterns` never applies).

So the images are already fully materialized before they reach the browser; wrapping them in `next/image` adds required `width`/`height` and loses Chakra's `Fallback` layering for **zero optimization gain**. Uploads are also capped at 100 KB and shown at about 32 px.

Guidance:

- Use `next/image` for **static/public** assets referenced by a real URL (_e.g._, the header logo via a static import).
- Keep **private, access-controlled** images (avatars) on `Avatar.Image` with base64 data URLs.
- Revisit only if avatars move to **public blobs served by URL**: then `next/image` plus `next.config.ts` `images.remotePatterns` become worthwhile, at the cost of the private-access model.

## 📦 Database interactions

Ensure that PostgreSQL (latest version) is running on your local machine, start it via Homebrew:

```bash
brew services start postgresql@18
```

Generate a new migration after modifying the database schema:

```bash
pnpm db:generate --name <description_of_change>
```

Migrate the database:

```bash
pnpm db:migrate
```

### Rule of thumb 👍🏻

#### 1. Database relationships

**With `fields` and `references`, your table owns the foreign key.** Use this when the current table has the foreign key column (many-to-one):

```ts
parent: one(ParentTable, {
  fields: [CurrentTable.parent_id],
  references: [ParentTable.id],
});
```

**Without `fields` and `references`, the other table owns the foreign key.** Use this when the other table has the foreign key pointing back to yours (one-to-one):

```ts
child: one(ChildTable); // or many(ChildTable)
```

#### 2. `'use cache'` with `cacheTag()`

Use when all three conditions are met:

- **Stable data**: doesn't change on every request (_e.g._, locations, leagues, opponents)
- **No or few parameters**, which avoids cache key explosion:
  - `getLocations()` has zero params ✅
  - `getMatches(game_type, interval)` has many ❌
- **Clear invalidation**: a server action calls `revalidateTag()` after every mutation

## ⭐️ Others

- Check the [snippet directory](https://github.com/chakra-ui/chakra-ui/tree/main/apps/compositions/src/ui) to see Chakra UI changes.

### Badge variants

Pick by what the value _means_, not by the column:

- `surface` + `colorPalette={getColor(...)}` → **semantic status** where the color carries meaning (status/state/condition/result). _e.g._, attendance status, asset condition, match result.
- `outline`, no `colorPalette` → **neutral labels** that classify but aren't good/bad (role, position).
- `surface` + fixed color → **UI accents** not driven by data (_e.g._, “TODAY”, “N selected”).
