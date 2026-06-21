import { MOCK_ABSENCE_REASONS } from '@/test/mocks/analytics';
import { renderWithUI, screen } from '@/test/utilities';

import { AbsenceReason } from '@/types/analytics';
import AbsenceReasonsBreakdown from './AbsenceReasonsBreakdown';

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
