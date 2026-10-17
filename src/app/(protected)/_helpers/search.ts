import {
  ClipboardPlus,
  ListChecks,
  UserRound,
  type LucideIcon,
} from 'lucide-react';

import type { Action, Resource } from '@/utils/permissions';

import { SIDEBAR_GROUP, type SidebarGroup } from './utils';

export type SearchEntry = {
  /** Stable key, persisted in the recent-pages history */
  id: string;
  path: string;
  icon: LucideIcon;
  resource: Resource;
  action: Action;
  /** Message namespace holding `metadata.title` and `metadata.description` */
  namespace: string;
  /** Key under `shell.sidebar.groups`; none means the account pages */
  group?: SidebarGroup['title'];
  searchable?: boolean;
  /** The path continues with the signed-in user's id (`/profile/{id}`) */
  personal?: boolean;
};

export const SEARCH_ENTRIES: Array<SearchEntry> = [
  ...SIDEBAR_GROUP.flatMap(({ title, items }) =>
    items
      .filter(({ disabled }) => !disabled)
      .map(({ icon, resource, searchable }) => ({
        id: resource,
        path: `/${resource}`,
        icon,
        resource,
        action: 'view' as const,
        namespace: resource.replace(/-(\w)/g, (_, char: string) =>
          char.toUpperCase(),
        ),
        group: title,
        searchable,
      })),
  ),
  {
    id: 'test-types',
    path: '/periodic-testing/test-types',
    icon: ListChecks,
    resource: 'periodic-testing',
    action: 'view',
    namespace: 'periodicTesting.testTypes',
    group: 'performance',
    searchable: true,
  },
  {
    id: 'add-result',
    path: '/periodic-testing/add-result',
    icon: ClipboardPlus,
    resource: 'periodic-testing',
    action: 'create',
    namespace: 'periodicTesting.addResult',
    group: 'performance',
  },
  {
    id: 'profile',
    path: '/profile',
    icon: UserRound,
    resource: 'profile',
    action: 'view',
    namespace: 'profile',
    personal: true,
  },
];

/** The entry a pathname belongs to; the longest matching path wins. */
export function matchEntry(pathname: string): SearchEntry | undefined {
  return SEARCH_ENTRIES.filter(
    ({ path }) => pathname === path || pathname.startsWith(`${path}/`),
  ).sort((a, b) => b.path.length - a.path.length)[0];
}

/**
 * Lowercase, collapse spaces and strip accents so "doi hinh" matches "Đội
 * hình". `đ` is a letter of its own in Unicode, not `d` plus a mark.
 */
export function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

export type IndexedEntry = SearchEntry & {
  title: string;
  description: string;
  groupLabel: string;
  /** Normalized title, plus the URL slug so English names work in any locale */
  names: Array<string>;
  haystack: string;
};

/** Attach the translated labels and the text the search matches against */
export function indexEntry(
  entry: SearchEntry,
  labels: Pick<IndexedEntry, 'title' | 'description' | 'groupLabel'>,
): IndexedEntry {
  const slug = entry.path.slice(entry.path.lastIndexOf('/') + 1);
  const names = [normalize(labels.title), slug.replace(/-/g, ' ')];
  const haystack = normalize(
    [labels.title, labels.description, labels.groupLabel, ...names].join(' '),
  );

  return { ...entry, ...labels, names, haystack };
}

/** Lower is better; `-1` means some word is missing. */
function score({ names, haystack }: IndexedEntry, query: string): number {
  const words = query.split(' ');
  if (!words.every((word) => haystack.includes(word))) return -1;
  if (names.some((name) => name.startsWith(query))) return 0;

  const wordStart = names.some((name) =>
    name.split(' ').some((part) => part.startsWith(words[0])),
  );
  return wordStart ? 1 : 2;
}

/** Pages containing every word of a non-empty query, best matches first */
export function rankPages(
  entries: Array<IndexedEntry>,
  query: string,
): Array<IndexedEntry> {
  const normalized = normalize(query);

  return entries
    .map((entry) => ({ entry, score: score(entry, normalized) }))
    .filter(({ score }) => score >= 0)
    .sort((a, b) => a.score - b.score)
    .map(({ entry }) => entry);
}

/** Word count of the longest page name the query starts with, else 0. */
function prefixLength({ names }: IndexedEntry, words: Array<string>): number {
  return Math.max(
    0,
    ...names
      .map((name) => name.split(' '))
      .filter((parts) => parts.every((part, index) => words[index] === part))
      .map((parts) => parts.length),
  );
}

export type SearchTarget = { entry: IndexedEntry; term: string };

/**
 * Pages to search a non-empty term in via `?q=`. A query that starts with a
 * page name (_e.g.,_ "roster nguyen") is scoped to that page, the longest name
 * winning so "đội hình x" means Roster ("Đội hình"), not Teams ("Đội").
 * Otherwise every searchable page is offered, the matching ones first.
 */
export function searchTargets(
  entries: Array<IndexedEntry>,
  query: string,
  limit = 5,
): Array<SearchTarget> {
  const words = query.trim().split(/\s+/);
  const normalized = words.map(normalize);
  const searchable = entries.filter(({ searchable }) => searchable);

  const longest = Math.max(
    ...entries.map((entry) => prefixLength(entry, normalized)),
  );
  const rest = words.slice(longest).join(' ');
  const scoped =
    longest && rest
      ? searchable.filter(
          (entry) => prefixLength(entry, normalized) === longest,
        )
      : [];
  if (scoped.length) {
    return scoped.slice(0, limit).map((entry) => ({ entry, term: rest }));
  }

  const term = words.join(' ');
  return [...new Set([...rankPages(searchable, term), ...searchable])]
    .slice(0, limit)
    .map((entry) => ({ entry, term }));
}
