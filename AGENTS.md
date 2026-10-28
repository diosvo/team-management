<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Third-party files: don't format or lint

These paths are imported from third-party tools. Never run Prettier, `eslint --fix` or any other formatter over them, and never format the whole repo; format only the files you edit (`npx prettier --single-quote --write <file>`).

- `src/components/ui/` (Chakra UI snippets)
- `.agents/skills/` (installed agent skills)
- `pnpm-*.yaml` (written by pnpm)

They're listed in `.prettierignore` and in the ESLint `globalIgnores`.
