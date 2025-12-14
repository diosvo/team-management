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

#### 1️⃣ Entity Names (Singular)

Current entities:

- User (Player | Coach)
- Team
- Asset
- Rule

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

## ⭐️ Others

- Check the [snippet directory](https://github.com/chakra-ui/chakra-ui/tree/main/apps/compositions/src/ui) to see Chakra UI changes.
