import type { PieSectorShapeProps } from 'recharts';

import { MOCK_ABSENCE_REASONS } from '@/test/mocks/analytics';
import { renderWithUI, screen } from '@/test/utilities';
import type { AbsenceReason } from '@/types/analytics';

import AbsenceReasonsBreakdown, {
  formatSliceLabel,
  ReasonSector,
} from './AbsenceReasonsBreakdown';

type LabelFn = (entry: { name?: unknown; value?: unknown }) => string;

// jsdom has no layout, so the real PieChart never draws slices. Render each
// slice's label directly, plus one with malformed name/value to exercise the
// label fallbacks.
vi.mock('recharts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('recharts')>();
  return {
    ...actual,
    PieChart: ({ children }: { children?: React.ReactNode }) => (
      <div data-testid="pie-chart">{children}</div>
    ),
    Pie: ({
      data,
      label,
    }: {
      data: Array<{ name: string; count: number }>;
      label: LabelFn;
    }) => (
      <ul>
        {data.map((entry) => (
          <li key={entry.name}>
            {label({ name: entry.name, value: entry.count })}
          </li>
        ))}
        <li data-testid="malformed-label">
          {label({ name: 42, value: 'n/a' })}
        </li>
      </ul>
    ),
  };
});

describe('AbsenceReasonsBreakdown', () => {
  const setup = (reasons: Array<AbsenceReason>) =>
    renderWithUI(<AbsenceReasonsBreakdown reasons={reasons} />);

  test('renders the card title and description', () => {
    setup(MOCK_ABSENCE_REASONS);

    expect(screen.getByText('Most Common Absence Reasons')).toBeInTheDocument();
    expect(
      screen.getByText('Top 5 reasons why players miss training'),
    ).toBeInTheDocument();
  });

  test('renders the empty state when there are no reasons', () => {
    setup([]);

    expect(screen.getByText('No absence reasons records')).toBeInTheDocument();
  });

  test('renders the chart instead of the empty state when reasons exist', () => {
    setup(MOCK_ABSENCE_REASONS);

    expect(
      screen.queryByText('No absence reasons records'),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
  });

  test('labels each slice with its name and count', () => {
    setup([
      { name: 'Sick', count: 4, percentage: 40 },
      { name: 'Unknown', count: 6, percentage: 60 },
    ]);

    expect(screen.getByText('Sick: 4')).toBeInTheDocument();
    expect(screen.getByText('Unknown: 6')).toBeInTheDocument();
  });

  test('falls back to an empty name and zero count for malformed labels', () => {
    setup(MOCK_ABSENCE_REASONS);

    expect(screen.getByTestId('malformed-label')).toHaveTextContent(/^: 0$/);
  });
});

describe('formatSliceLabel', () => {
  test('localizes the "Unknown" reason name', () => {
    expect(formatSliceLabel('Unknown', 3, 'Unknown reason')).toBe(
      'Unknown reason: 3',
    );
  });

  test('uses the reason name as-is otherwise', () => {
    expect(formatSliceLabel('Injury', 5, 'Unknown reason')).toBe('Injury: 5');
  });
});

describe('ReasonSector', () => {
  test('fills the slice with the reason’s own color', () => {
    const props = {
      cx: 50,
      cy: 50,
      innerRadius: 10,
      outerRadius: 40,
      startAngle: 0,
      endAngle: 180,
      payload: { color: '#123456' },
    } as PieSectorShapeProps;

    const { container } = renderWithUI(
      <svg>
        <ReasonSector {...props} />
      </svg>,
    );

    expect(container.querySelector('path')).toHaveAttribute('fill', '#123456');
  });
});
