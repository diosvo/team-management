import {
  SEARCH_ENTRIES,
  indexEntry,
  matchEntry,
  normalize,
  rankPages,
  searchTargets,
  type IndexedEntry,
} from './search';
import { SIDEBAR_GROUP } from './utils';

/** Index an entry with hand-written labels, standing in for the messages */
const index = (id: string, title: string, description = '') => {
  const entry = SEARCH_ENTRIES.find((entry) => entry.id === id)!;
  return indexEntry(entry, {
    title,
    description,
    groupLabel: entry.group ?? 'My Account',
  });
};

const ids = (entries: Array<{ id: string }>) => entries.map(({ id }) => id);

describe('SEARCH_ENTRIES', () => {
  test('mirrors the enabled sidebar items, then the extra pages', () => {
    const sidebar = SIDEBAR_GROUP.flatMap(({ items }) =>
      items.filter(({ disabled }) => !disabled).map(({ resource }) => resource),
    );

    expect(ids(SEARCH_ENTRIES)).toEqual([
      ...sidebar,
      'test-types',
      'add-result',
      'profile',
    ]);
    expect(sidebar).not.toContain('documents');
  });

  test('derives the message namespace and searchable flag from the sidebar', () => {
    expect(SEARCH_ENTRIES.find(({ id }) => id === 'team-rule')).toMatchObject({
      path: '/team-rule',
      namespace: 'teamRule',
      group: 'overview',
      action: 'view',
      searchable: undefined,
    });
    expect(SEARCH_ENTRIES.find(({ id }) => id === 'roster')).toMatchObject({
      namespace: 'roster',
      group: 'team-management',
      searchable: true,
    });
  });
});

describe('matchEntry', () => {
  test.each([
    ['/roster', 'roster'],
    ['/roster/user-1', 'roster'],
    ['/periodic-testing', 'periodic-testing'],
    ['/periodic-testing/test-types', 'test-types'],
    ['/profile/user-1', 'profile'],
  ])('matches %s to %s, preferring the longest path', (pathname, id) => {
    expect(matchEntry(pathname)?.id).toBe(id);
  });

  test.each(['/', '/docs', '/rosters'])('matches nothing for %s', (path) => {
    expect(matchEntry(path)).toBeUndefined();
  });
});

describe('normalize', () => {
  test('strips accents, đ, case and extra spaces', () => {
    expect(normalize('  Đội   Hình  Điểm danh ')).toBe('doi hinh diem danh');
  });
});

describe('indexEntry', () => {
  test('adds the labels, the normalized names and a haystack', () => {
    const entry = index('test-types', 'Bài kiểm tra', 'Quản lý');

    expect(entry).toMatchObject({
      id: 'test-types',
      title: 'Bài kiểm tra',
      names: ['bai kiem tra', 'test types'],
      haystack: 'bai kiem tra quan ly performance bai kiem tra test types',
    });
  });
});

describe('rankPages', () => {
  const entries: Array<IndexedEntry> = [
    index('teams', 'Teams', 'Opponent teams'),
    index('training', 'Training Sessions', 'Schedule sessions'),
    index('test-types', 'Test Types', 'Configure tests'),
    index('roster', 'Đội hình', 'Xem đội hình'),
  ];

  test('ranks name prefixes, then word prefixes, then any other match', () => {
    // Names start with "te" for Teams and Test Types; the rest only match
    // through their group key ("team-management")
    expect(ids(rankPages(entries, 'te'))).toEqual([
      'teams',
      'test-types',
      'training',
      'roster',
    ]);
    // "Sessions" starts a word of Training Sessions; Teams only has "settings"
    expect(ids(rankPages(entries, 'se'))).toEqual(['training', 'teams']);
  });

  test('requires every word and ignores accents', () => {
    expect(ids(rankPages(entries, 'DOI hinh'))).toEqual(['roster']);
    expect(ids(rankPages(entries, 'doi zzz'))).toEqual([]);
  });

  test('matches the URL slug in any locale', () => {
    expect(ids(rankPages(entries, 'roster'))).toEqual(['roster']);
  });
});

describe('searchTargets', () => {
  const entries = [
    index('roster', 'Đội hình'),
    index('training', 'Training Sessions'),
    index('teams', 'Đội'),
    index('dashboard', 'Dashboard'),
    index('test-types', 'Test Types'),
  ];

  const targets = (query: string, limit?: number) =>
    searchTargets(entries, query, limit).map(
      ({ entry, term }) => `${entry.id}:${term}`,
    );

  test('scopes a query that starts with a page name to that page', () => {
    expect(targets('roster nguyen')).toEqual(['roster:nguyen']);
    expect(targets('test types  Văn An')).toEqual(['test-types:Văn An']);
  });

  test('lets the longest page name win', () => {
    expect(targets('đội hình nguyen')).toEqual(['roster:nguyen']);
    expect(targets('doi abc')).toEqual(['teams:abc']);
  });

  test('offers every searchable page when the query is only a page name', () => {
    expect(targets('đội hình')).toEqual([
      'roster:đội hình',
      'training:đội hình',
      'teams:đội hình',
      'test-types:đội hình',
    ]);
  });

  test('ignores a scope on a page that cannot be searched', () => {
    expect(targets('dashboard x', 2)).toEqual([
      'roster:dashboard x',
      'training:dashboard x',
    ]);
  });

  test('puts matching pages first and respects the limit', () => {
    expect(targets('types', 2)).toEqual(['test-types:types', 'roster:types']);
  });
});
