import { renderWithUI, screen } from '@/test/utilities';

import type { MatchesRateRecord } from '@/types/analytics';
import MatchesRate from './MatchesRate';

describe('MatchesRate', () => {
  const MOCK_RECORDS: Array<MatchesRateRecord> = [
    { outcome: 'win', league: 3, friendly: 2 },
    { outcome: 'draw', league: 1, friendly: 0 },
    { outcome: 'lose', league: 2, friendly: 1 },
  ];

  const setup = (records: Array<MatchesRateRecord>) =>
    renderWithUI(<MatchesRate records={records} />);

  test('renders the card title and description', () => {
    setup(MOCK_RECORDS);

    expect(screen.getByText('Matches Record')).toBeInTheDocument();
    expect(
      screen.getByText('Performance in league vs friendly matches'),
    ).toBeInTheDocument();
  });

  test('shows the empty state when there are no records', () => {
    setup([]);

    expect(screen.getByText('Matches Record')).toBeInTheDocument();
    expect(screen.getByText('No matches records')).toBeInTheDocument();
  });

  test('shows the empty state when every outcome is zero', () => {
    setup(
      MOCK_RECORDS.map(({ outcome }) => ({ outcome, league: 0, friendly: 0 })),
    );

    expect(screen.getByText('No matches records')).toBeInTheDocument();
  });

  test('shows the chart instead of the empty state when matches exist', () => {
    setup(MOCK_RECORDS);

    expect(screen.queryByText('No matches records')).not.toBeInTheDocument();
  });
});
