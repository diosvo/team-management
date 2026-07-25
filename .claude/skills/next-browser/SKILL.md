---
name: next-browser
description: Drive the running Next.js dev app from the shell with the `next-browser` CLI (@vercel/next-browser) — inspect the React component tree, accessibility snapshot, network, errors, PPR shells, and Core Web Vitals, and interact (click/fill/eval) so changes can be verified in a real browser without a human clicking. Use when asked to inspect, debug, screenshot, profile, or confirm behavior in the actual app rather than only via tests.
---

# next-browser

`next-browser` (package `@vercel/next-browser`, installed globally) exposes React
DevTools and the Next.js dev overlay as stateless shell commands against a
long-lived Chromium daemon. Each command is one-shot; the browser persists
across commands, so drive it in a loop: run a command, read the structured
text output, decide the next command.

## Preconditions

1. The dev server must be running. This project uses `pnpm dev` (`next dev`),
   default `http://localhost:3000`. If nothing responds there, start it in the
   background before opening the browser.
2. `next-browser` and Playwright Chromium are already installed on this machine.
   The binary lives at `~/Library/pnpm/bin/next-browser`; if `next-browser` is
   not found, prefix with that path or ensure `~/Library/pnpm/bin` is on PATH.

## Core loop

```bash
next-browser open http://localhost:3000   # launch + navigate (daemon starts)
next-browser snapshot                      # a11y tree with [ref=eN] markers
next-browser click e3                      # interact by ref
next-browser close                         # tear down when done
```

Always `open` before other commands, and `close` when finished to free the daemon.

## Command reference

**Lifecycle / navigation**
- `open <url> [--cookies <file>]` — launch browser and navigate
- `close` — close browser and kill daemon
- `goto <url>` — full-page navigation (new document load)
- `push [path]` — client-side navigation (interactive picker if no path)
- `back` / `reload` / `restart-server`
- `ssr lock` / `ssr unlock` — block/re-enable external scripts (SSR-only mode)

**Inspection**
- `tree` — full React component tree (hierarchy, IDs, keys)
- `tree <id>` — one component's props, hooks, state, source location
- `snapshot` — accessibility tree with `[ref=eN]` markers on interactive elements
- `errors` — build and runtime errors for the current page
- `logs` — recent dev server log output
- `browser-logs` — browser console output
- `network [idx]` — list requests, or inspect one (headers, body)
- `screenshot [caption] [--full-page]` — viewport PNG to a temp file

**Interaction**
- `click <ref|text|selector>` — real pointer events (works with Radix/Headless UI)
- `fill <ref|selector> <value>` — fill a text input or textarea
- `eval [ref] <script>` — run JS in page context (supports `--file` and stdin)
- `viewport [WxH]` — show or set viewport size

**Performance & PPR**
- `perf [url]` — Core Web Vitals + React hydration timing in one pass
- `renders start` / `renders stop [--json]` — per-component re-render profile
- `ppr lock` / `ppr unlock` — freeze/resume dynamic content to inspect the static shell.
  **Requires PPR to be enabled** (`cacheComponents: true` in `next.config.ts` on
  Next 16+; `experimental.ppr` was removed). This project does NOT enable it, so
  these two commands throw `React.unstable_postpone is not defined` — skip them
  here and use `perf` / `renders` / `tree` to inspect rendering instead.
  NOTE: `ppr lock` is **persistent daemon state** — it stays active across every
  navigation until `ppr unlock` or `close`. If you see a postpone error on a page
  that has nothing to do with PPR, a stale `ppr lock` is the cause: run
  `next-browser close` to reset the daemon, then `open` fresh.

**Next.js MCP**
- `page` — route segments for current URL
- `project` — project root and dev server URL
- `routes` — all app router routes
- `action <id>` — inspect a server action by ID

## Working tips

- Prefer `snapshot` over `screenshot` for deciding what to interact with — it
  gives parseable `[ref=eN]` markers; use `screenshot` only when a visual is
  needed or the user asks for one.
- `ref` markers (`e0`, `e1`, …) are re-issued per `snapshot`; re-snapshot after
  navigation or DOM changes before clicking a stale ref.
- Use `tree <id>` to confirm a component received the props/hooks you expect —
  the `source:` line maps back to the file to edit.
- Use `perf` / `renders` to verify a performance change, and `ppr lock` +
  `ppr unlock` to inspect what falls into the static shell vs. dynamic holes.
- Run `next-browser --help` for the authoritative, version-specific command list.
