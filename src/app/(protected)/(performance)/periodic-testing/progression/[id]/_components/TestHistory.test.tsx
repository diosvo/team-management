import {
  MOCK_PLAYER_TYPE_PROGRESSION,
  MOCK_PROGRESSION_TYPE_TIMED,
} from '@/test/mocks/progression';
import { renderWithUI, screen, within } from '@/test/utilities';

import TestHistory from './TestHistory';

describe('TestHistory', () => {
  test('lists every result newest first against the team average', () => {
    renderWithUI(
      <TestHistory
        types={[
          MOCK_PLAYER_TYPE_PROGRESSION,
          {
            ...MOCK_PLAYER_TYPE_PROGRESSION,
            type: MOCK_PROGRESSION_TYPE_TIMED,
            history: [{ date: '2026-02-15', result: 5, team_average: 5.5 }],
          },
        ]}
      />,
    );

    expect(screen.getByText('Test History')).toBeInTheDocument();
    const rows = screen.getAllByRole('row').slice(1);
    expect(rows).toHaveLength(4);
    const [row1, row2, row3, row4] = rows;
    expect(within(row1).getByText('Push-ups')).toBeInTheDocument();
    expect(within(row2).getByText('Sprint 30m')).toBeInTheDocument();
    // Above average, faster than average, level, below average.
    expect(within(row1).getByText(/^\+/)).toBeInTheDocument();
    expect(within(row2).getByText(/^\+/)).toBeInTheDocument();
    expect(within(row3).getByText('0.0%')).toBeInTheDocument();
    expect(within(row4).getByText(/^-/)).toBeInTheDocument();
  });
});
