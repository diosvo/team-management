import { renderWithUI, screen } from '@/test/utilities';

import { MatchesRateRecord } from '@/types/analytics';
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

  test('renders without crashing when there are no records', () => {
    setup([]);

    expect(screen.getByText('Matches Record')).toBeInTheDocument();
  });
});
