import {
  MOCK_PLAYER_PROGRESSION,
  MOCK_TYPE_PROGRESSION,
} from '@/test/mocks/progression';
import { renderWithUI, screen } from '@/test/utilities';

import type { TypeProgression } from '@/types/periodic-testing';
import { PerformanceBand, ProgressStatus } from '@/utils/enum';

import ProgressionStats from './ProgressionStats';

const statValue = (label: string) =>
  screen.getByText(label).closest('dl, div[class*="stat"]')?.textContent ??
  screen.getByText(label).parentElement?.parentElement?.textContent;

describe('ProgressionStats', () => {
  test('shows dashes when there is no progression', () => {
    renderWithUI(<ProgressionStats progression={null} />);

    expect(statValue('Below Target')).toContain('-');
    expect(statValue('Team Average')).toContain('-');
    expect(statValue('Team Best')).toContain('-');
    expect(statValue('Improving')).toContain('0');
  });

  test('counts players by trend, target band and attendance', () => {
    const progression: TypeProgression = {
      ...MOCK_TYPE_PROGRESSION,
      players: [
        ...MOCK_TYPE_PROGRESSION.players,
        {
          ...MOCK_PLAYER_PROGRESSION,
          player_id: 'player-3',
          status: ProgressStatus.STABLE,
          band: PerformanceBand.BELOW_TARGET,
        },
      ],
    };

    renderWithUI(<ProgressionStats progression={progression} />);

    expect(statValue('Improving')).toContain('1');
    expect(statValue('Regressing')).toContain('1');
    // NEEDS_WORK and BELOW_TARGET both count as below target.
    expect(statValue('Below Target')).toContain('2');
    expect(statValue('Missed Latest Test')).toContain('1');
    expect(statValue('Team Average')).toContain('36');
    expect(statValue('Team Best')).toContain('42');
  });

  test('shows a dash for below target when the type has no target', () => {
    renderWithUI(
      <ProgressionStats
        progression={{
          ...MOCK_TYPE_PROGRESSION,
          type: { ...MOCK_TYPE_PROGRESSION.type, target: null },
          team_average: null,
          team_best: null,
          players: [],
        }}
      />,
    );

    expect(statValue('Below Target')).toContain('-');
    expect(statValue('Team Average')).toContain('-');
  });
});
