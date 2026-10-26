import en from './messages/en';
import vi from './messages/vi';

type Tree = { [key: string]: string | Array<string> | Tree };

/** `{ a: { b: 'x' } }` → `[['a.b', 'x']]` */
const flatten = (tree: Tree, prefix = ''): Array<[string, unknown]> =>
  Object.entries(tree).flatMap(([key, value]) =>
    typeof value === 'object' && !Array.isArray(value)
      ? flatten(value, `${prefix}${key}.`)
      : [[`${prefix}${key}`, value]],
  );

/** Index of the `}` that closes the `{` at `start` */
const closing = (text: string, start: number) => {
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    if (text[i] === '{') depth++;
    if (text[i] === '}' && --depth === 0) return i;
  }
  return text.length;
};

/**
 * ICU argument names, including those nested in plural/select branches,
 * _e.g.,_ `{count, plural, one {# by {name}} other {…}}` → `count, name`
 */
const argumentsOf = (message: unknown): Array<string> => {
  const names = new Set<string>();

  const scan = (text: string) => {
    for (let i = text.indexOf('{'); i !== -1;) {
      const end = closing(text, i);
      const [name, type, ...branches] = text.slice(i + 1, end).split(',');
      names.add(name.trim());
      if (type) scanBranches(branches.join(','));
      i = text.indexOf('{', end + 1);
    }
  };

  // `selector {content}` pairs: only the content can hold arguments
  const scanBranches = (text: string) => {
    for (let i = text.indexOf('{'); i !== -1;) {
      const end = closing(text, i);
      scan(text.slice(i + 1, end));
      i = text.indexOf('{', end + 1);
    }
  };

  scan(String(message));
  return [...names].sort();
};

describe('messages', () => {
  const enEntries = new Map(flatten(en as Tree));
  const viEntries = new Map(flatten(vi as Tree));

  test('registers the same namespaces for every locale', () => {
    expect(Object.keys(vi).sort()).toEqual(Object.keys(en).sort());
  });

  test('vi has exactly the keys of en', () => {
    expect([...viEntries.keys()].sort()).toEqual([...enEntries.keys()].sort());
  });

  test('no vi message is empty', () => {
    const empty = [...viEntries].filter(
      ([, value]) => String(value).trim() === '',
    );

    expect(empty).toEqual([]);
  });

  test('reads arguments through plural and select branches', () => {
    expect(
      argumentsOf(
        '{count, plural, one {# by {name}} other {# by {name}}} at {time}',
      ),
    ).toEqual(['count', 'name', 'time']);
    expect(argumentsOf('{remaining, select, true {Some} other {All}}')).toEqual(
      ['remaining'],
    );
  });

  test('vi messages take the same arguments as en', () => {
    const mismatched = [...enEntries]
      .filter(
        ([key, value]) =>
          argumentsOf(value).join() !== argumentsOf(viEntries.get(key)).join(),
      )
      .map(([key]) => key);

    expect(mismatched).toEqual([]);
  });
});
