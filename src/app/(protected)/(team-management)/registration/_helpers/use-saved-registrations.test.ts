import { head, omit } from 'es-toolkit';

import { MOCK_SAVED_REGISTRATION } from '@/test/mocks/registration';
import { act, renderHook } from '@/test/utilities';

import { useSavedRegistrations } from './use-saved-registrations';

const STORAGE_KEY = 'registration:saved';

// What the page hands to `save`; the hook assigns the id.
const newEntry = (overrides = {}) => ({
  ...omit(MOCK_SAVED_REGISTRATION, ['id']),
  ...overrides,
});
const NAME = MOCK_SAVED_REGISTRATION.leagueName;

/**
 * Node 26's own global `localStorage` is gated behind `--localstorage-file`
 * and shadows jsdom's implementation, so neither is usable as-is here.
 * A minimal in-memory stand-in is enough for what this hook needs.
 */
const createMemoryStorage = (): Storage => {
  let store = new Map<string, string>();

  return {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => void store.set(key, value),
    removeItem: (key) => void store.delete(key),
    clear: () => void (store = new Map()),
    key: (index) => Array.from(store.keys())[index] ?? null,
    get length() {
      return store.size;
    },
  };
};

describe('useSavedRegistrations', () => {
  beforeAll(() => {
    vi.stubGlobal('localStorage', createMemoryStorage());
  });

  afterAll(() => {
    vi.unstubAllGlobals();
  });

  beforeEach(() => {
    localStorage.clear();
  });

  test('starts empty when nothing is persisted', () => {
    const { result } = renderHook(() => useSavedRegistrations());

    expect(result.current.items).toEqual([]);
  });

  test('hydrates from localStorage after mount', () => {
    const saved = [{ ...newEntry(), id: '1' }];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));

    const { result } = renderHook(() => useSavedRegistrations());

    expect(result.current.items).toEqual(saved);
  });

  test('ignores corrupt persisted data', () => {
    localStorage.setItem(STORAGE_KEY, '{not json');

    const { result } = renderHook(() => useSavedRegistrations());

    expect(result.current.items).toEqual([]);
  });

  test('ignores non-array persisted data', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ not: 'an array' }));

    const { result } = renderHook(() => useSavedRegistrations());

    expect(result.current.items).toEqual([]);
  });

  test('save prepends a new entry with a generated id and persists it', () => {
    const { result } = renderHook(() => useSavedRegistrations());

    act(() => {
      result.current.save(newEntry());
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0]).toMatchObject({
      leagueName: NAME,
    });
    expect(head(result.current.items)!.id).toBeTruthy();

    const persisted = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(persisted).toHaveLength(1);
  });

  test('remove deletes the matching entry and persists the change', () => {
    const { result } = renderHook(() => useSavedRegistrations());

    act(() => {
      result.current.save(newEntry());
    });
    const id = head(result.current.items)!.id;

    act(() => {
      result.current.remove(id);
    });

    expect(result.current.items).toEqual([]);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toEqual([]);
  });

  test('getUniqueName returns the base name when it is not taken', () => {
    const { result } = renderHook(() => useSavedRegistrations());

    expect(result.current.getUniqueName(NAME)).toBe(NAME);
  });

  test('getUniqueName appends an incrementing suffix for collisions', () => {
    const { result } = renderHook(() => useSavedRegistrations());

    act(() => {
      result.current.save(newEntry({ leagueName: NAME }));
    });
    act(() => {
      result.current.save(newEntry({ leagueName: `${NAME} (2)` }));
    });

    expect(result.current.getUniqueName(NAME)).toBe(`${NAME} (3)`);
  });

  test('save is best-effort when localStorage throws', () => {
    const setItemSpy = vi
      .spyOn(localStorage, 'setItem')
      .mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

    const { result } = renderHook(() => useSavedRegistrations());

    act(() => {
      result.current.save(newEntry());
    });

    expect(result.current.items).toHaveLength(1);

    setItemSpy.mockRestore();
  });
});
