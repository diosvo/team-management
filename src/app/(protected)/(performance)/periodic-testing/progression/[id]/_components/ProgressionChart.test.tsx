import { cloneElement, type ReactElement } from 'react';

import {
  MOCK_PLAYER_TYPE_PROGRESSION,
  MOCK_PROGRESSION_TYPE_TIMED,
} from '@/test/mocks/progression';
import { renderWithUI, screen } from '@/test/utilities';

import ProgressionChart from './ProgressionChart';

const yAxisSpy = vi.fn();

// jsdom has no layout, so recharts draws nothing. Stub the primitives and
// render the tooltip content directly in its active and inactive states.
vi.mock('recharts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('recharts')>();
  const point = { date: '2026-02-01', result: 35, team_average: 33.5 };
  return {
    ...actual,
    LineChart: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    ),
    CartesianGrid: () => null,
    XAxis: () => null,
    YAxis: (props: { reversed: boolean }) => {
      yAxisSpy(props);
      return null;
    },
    Line: () => null,
    ReferenceLine: ({ label }: { label: { value: string } }) => (
      <span>{label.value}</span>
    ),
    Tooltip: ({ content }: { content: ReactElement }) => (
      <>
        {cloneElement(content, {
          active: true,
          payload: [{ payload: point }],
        } as never)}
        {cloneElement(content, { active: false } as never)}
        {cloneElement(content, { active: true, payload: [] } as never)}
      </>
    ),
  };
});

describe('ProgressionChart', () => {
  test('renders the tooltip for the hovered point and the target line', () => {
    renderWithUI(
      <ProgressionChart progression={MOCK_PLAYER_TYPE_PROGRESSION} />,
    );

    expect(screen.getByText('Player: 35 reps')).toBeInTheDocument();
    expect(screen.getByText('Team avg: 33.5 reps')).toBeInTheDocument();
    expect(screen.getByText('Target (40)')).toBeInTheDocument();
    expect(screen.getByText('Goal (45)')).toBeInTheDocument();
    expect(yAxisSpy).toHaveBeenCalledWith(
      expect.objectContaining({ reversed: false }),
    );
  });

  test('reverses the axis and drops the target line for lower-is-better types', () => {
    renderWithUI(
      <ProgressionChart
        progression={{
          ...MOCK_PLAYER_TYPE_PROGRESSION,
          type: MOCK_PROGRESSION_TYPE_TIMED,
          goal: null,
        }}
      />,
    );

    expect(screen.queryByText(/^Target/)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Goal/)).not.toBeInTheDocument();
    expect(yAxisSpy).toHaveBeenLastCalledWith(
      expect.objectContaining({ reversed: true }),
    );
  });
});
