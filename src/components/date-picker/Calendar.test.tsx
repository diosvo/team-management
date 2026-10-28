import { DatePicker as ChakraDatePicker } from '@chakra-ui/react';
import { format } from 'date-fns';

import { renderWithUI, screen } from '@/test/utilities';
import { DEFAULT_DATE_FORMAT } from '@/utils/constants';
import { getPresets, type DateSelection } from '@/utils/datetime';

import {
  Calendar,
  isSameSelection,
  parseDisplayString,
  parseIsoDay,
  toSelection,
} from './Calendar';

vi.mock('@/utils/datetime', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/utils/datetime')>();
  return { ...actual, getPresets: vi.fn(actual.getPresets) };
});

const TODAY = format(new Date(), DEFAULT_DATE_FORMAT);

describe('Calendar helpers', () => {
  test('parseIsoDay reads an ISO day and rejects empty or malformed input', () => {
    expect(parseIsoDay('2026-02-14')?.toString()).toBe('2026-02-14');
    expect(parseIsoDay('')).toBeUndefined();
    expect(parseIsoDay(undefined)).toBeUndefined();
    expect(parseIsoDay('14/02/2026')).toBeUndefined();
  });

  test('parseDisplayString reads a typed day and rejects anything else', () => {
    expect(parseDisplayString('14/02/2026')?.toString()).toBe('2026-02-14');
    expect(parseDisplayString('not a date')).toBeUndefined();
  });

  test('toSelection keeps both ends for a range and one day for single', () => {
    const range = { from: '2026-02-01', to: '2026-02-28' };

    expect(toSelection(range, 'range').map(String)).toEqual([
      '2026-02-01',
      '2026-02-28',
    ]);
    expect(toSelection(range, 'single').map(String)).toEqual(['2026-02-01']);
  });

  test('toSelection drops a window with a malformed end', () => {
    expect(toSelection({ from: '2026-02-01', to: 'nope' }, 'range')).toEqual(
      [],
    );
  });

  test('isSameSelection compares day by day', () => {
    const a = toSelection({ from: '2026-02-01', to: '2026-02-28' }, 'range');
    const b = toSelection({ from: '2026-02-01', to: '2026-02-27' }, 'range');

    expect(isSameSelection(a, a)).toBe(true);
    expect(isSameSelection(a, b)).toBe(false);
    expect(isSameSelection(a, a.slice(0, 1))).toBe(false);
  });
});

describe('Calendar', () => {
  const setup = ({
    selection = 'single',
    value = [],
    ...props
  }: Partial<React.ComponentProps<typeof Calendar>> & {
    selection?: DateSelection;
    value?: Array<string>;
  } = {}) =>
    renderWithUI(
      <ChakraDatePicker.Root
        defaultOpen
        selectionMode={selection}
        defaultValue={value.map((day) => parseIsoDay(day)!)}
      >
        <Calendar selection={selection} {...props} />
      </ChakraDatePicker.Root>,
    );

  test('lists the day presets for a single picker, pressing the selected one', () => {
    setup({ value: [TODAY] });

    expect(screen.getByRole('button', { name: 'Today' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: 'Yesterday' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    expect(screen.getByRole('button', { name: 'Tomorrow' })).toHaveTextContent(
      /\d/,
    );
  });

  test('lists the period presets for a range picker with both ends as hint', () => {
    setup({ selection: 'range' });

    const thisWeek = screen.getByRole('button', { name: 'This week' });
    expect(thisWeek).toHaveAttribute('aria-pressed', 'false');
    expect(thisWeek).toHaveTextContent('–');
    expect(
      screen.getByRole('button', { name: 'Last year' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Today' })).toBeNull();
  });

  test('omits the sidebar when presets are disabled', () => {
    setup({ presets: false });

    expect(screen.queryByRole('button', { name: 'Today' })).toBeNull();
  });

  test('omits the sidebar when no preset fits the bounds', () => {
    setup({ min: '2000-01-01', max: '2000-01-02' });

    expect(screen.queryByRole('button', { name: 'Today' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Yesterday' })).toBeNull();
  });

  test("falls back to a preset's own label when it has no message", () => {
    vi.mocked(getPresets).mockReturnValueOnce([
      {
        id: 'untranslated',
        label: 'Opening day',
        range: { from: '2026-02-14', to: '2026-02-14' },
      },
    ]);

    setup();

    expect(
      screen.getByRole('button', { name: 'Opening day' }),
    ).toBeInTheDocument();
  });
});
