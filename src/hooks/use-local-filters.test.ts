import { act, renderHook } from '@testing-library/react';

import { useLocalFilters } from './use-local-filters';

type Filters = { name: string; status: string };

const committed: Filters = { name: 'Kitu', status: 'active' };
const defaults: Filters = { name: '', status: '' };

describe('useLocalFilters', () => {
  const onApply = vi.fn();

  const setup = (
    overrideCommitted: Filters = committed,
    overrideDefaults: Filters = defaults,
  ) => {
    const hook = renderHook(() =>
      useLocalFilters(overrideCommitted, overrideDefaults, onApply),
    );

    return hook.result;
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initialisation', () => {
    test('initialises draft from committed', () => {
      const result = setup();

      expect(result.current.draft).toEqual(committed);
    });
  });

  describe('setField', () => {
    test('updates a single field in draft without affecting other fields', () => {
      const result = setup();

      act(() => result.current.setField('name', 'Dios'));

      expect(result.current.draft).toEqual({ name: 'Dios', status: 'active' });
    });

    test('updates multiple fields independently', () => {
      const result = setup();

      act(() => result.current.setField('name', 'Dios'));
      act(() => result.current.setField('status', 'inactive'));

      expect(result.current.draft).toEqual({
        name: 'Dios',
        status: 'inactive',
      });
    });
  });

  describe('handleReset', () => {
    test('resets draft to defaults', () => {
      const result = setup();

      act(() => result.current.setField('name', 'Dios'));
      act(() => result.current.handleReset());

      expect(result.current.draft).toEqual(defaults);
    });
  });

  describe('handleApply', () => {
    test('calls onApply with the current draft', () => {
      const result = setup();

      act(() => result.current.setField('name', 'Dios'));
      act(() => result.current.handleApply());

      expect(onApply).toHaveBeenCalledTimes(1);
      expect(onApply).toHaveBeenCalledWith({ name: 'Dios', status: 'active' });
    });

    test('calls onApply with the committed value when draft is unchanged', () => {
      const result = setup();

      act(() => result.current.handleApply());

      expect(onApply).toHaveBeenCalledWith(committed);
    });
  });

  describe('handleInteractOutside', () => {
    test('reverts draft to committed when interacting outside', () => {
      const result = setup();

      act(() => result.current.setField('name', 'Dios'));
      expect(result.current.draft.name).toBe('Dios');

      act(() => result.current.handleInteractOutside());

      expect(result.current.draft).toEqual(committed);
    });
  });
});
