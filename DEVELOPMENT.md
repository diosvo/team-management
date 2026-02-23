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
  - getMatches(is5x5, interval) has many ❌)
- Clear invalidation — A server action that calls revalidateTag() after every mutation.

## ⭐️ Others

- Check the [snippet directory](https://github.com/chakra-ui/chakra-ui/tree/main/apps/compositions/src/ui) to see Chakra UI changes.
