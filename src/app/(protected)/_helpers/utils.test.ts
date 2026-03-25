import { hrefPath } from './utils';

describe('hrefPath', () => {
  const cases = [
    { text: 'Dashboard', expected: '/dashboard' },
    { text: 'Team Rule', expected: '/team-rule' },
    { text: 'Cache Store', expected: '/cache-store' },
    { text: 'Periodic Testing', expected: '/periodic-testing' },
    { text: 'Roster', expected: '/roster' },
  ];

  test.each(cases)('converts "$text" to "$expected"', ({ text, expected }) => {
    expect(hrefPath(text)).toBe(expected);
  });
});
