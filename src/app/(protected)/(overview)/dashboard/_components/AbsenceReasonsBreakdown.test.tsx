import { MOCK_ABSENCE_REASONS } from '@/test/mocks/analytics';
import { renderWithUI, screen } from '@/test/utilities';

import type { AbsenceReason } from '@/types/analytics';
import AbsenceReasonsBreakdown, {
  formatSliceLabel,
  ReasonSector,
} from './AbsenceReasonsBreakdown';

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
    const { container } = renderWithUI(
      <svg>
        <ReasonSector
          cx={50}
          cy={50}
          innerRadius={10}
          outerRadius={40}
          startAngle={0}
          endAngle={180}
          payload={{ color: '#123456' }}
        />
      </svg>,
    );

    expect(container.querySelector('path')).toHaveAttribute(
      'fill',
      '#123456',
    );
  });
});
