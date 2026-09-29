import { renderWithUI, screen, setupTestLifecycle } from '@/test/utilities';

import { MATCH_STAT_FIELDS } from '@/utils/constants';

import MatchStatsTable, { type StatDraft } from './MatchStatsTable';

describe('MatchStatsTable', () => {
  setupTestLifecycle();

  const draft = Object.fromEntries(
    MATCH_STAT_FIELDS.map(({ key }) => [key, '0']),
  ) as StatDraft;

  const onChange = vi.fn();
  const onRemove = vi.fn();

  const setup = (withPlayer = true, disabled = false) =>
    renderWithUI(
      <MatchStatsTable
        players={
          withPlayer
            ? [
                { id: 'p1', name: 'Jane Doe', jersey_number: 7 },
                { id: 'p2', name: 'Kim Lee', jersey_number: null },
              ]
            : []
        }
        drafts={{ p1: draft }}
        disabled={disabled}
        onChange={onChange}
        onRemove={onRemove}
      />,
    );

  test('shows the empty state without players', () => {
    setup(false);

    expect(screen.getByText('No players on the sheet')).toBeInTheDocument();
  });

  test('renders translated stat headers and cell labels', () => {
    setup();

    expect(screen.getByText('Player')).toBeInTheDocument();
    expect(screen.getByText('PTS')).toHaveAttribute('aria-label', 'Points');
    expect(screen.getByText('PF')).toHaveAttribute(
      'aria-label',
      'Personal fouls',
    );
    expect(
      screen.getByRole('spinbutton', { name: 'Minutes played for Jane Doe' }),
    ).toBeInTheDocument();
  });

  test('shows the jersey number only when the player has one', () => {
    setup();

    expect(screen.getByText('7 -')).toBeInTheDocument();
    expect(screen.getByText('Kim Lee')).toBeInTheDocument();
    // A player without a draft starts at zero.
    expect(
      screen.getByRole('spinbutton', { name: 'Points for Kim Lee' }),
    ).toHaveValue('0');
  });

  test('reports edits of a stat cell', async () => {
    const { user } = setup();

    await user.type(
      screen.getByRole('spinbutton', { name: 'Points for Jane Doe' }),
      '5',
    );

    expect(onChange).toHaveBeenLastCalledWith('p1', 'points_scored', '05');
  });

  test('removes a player when their name is clicked', async () => {
    const { user } = setup();

    await user.click(screen.getByText('Jane Doe'));

    expect(onRemove).toHaveBeenCalledWith('p1');
  });

  test('removes a player from the keyboard', async () => {
    const { user } = setup();

    screen.getByRole('button', { name: /Jane Doe/ }).focus();
    await user.keyboard('{Enter}');
    expect(onRemove).toHaveBeenCalledWith('p1');

    onRemove.mockClear();
    await user.keyboard(' ');
    expect(onRemove).toHaveBeenCalledWith('p1');
  });

  test('ignores name clicks while disabled', async () => {
    const { user } = setup(true, true);

    await user.click(screen.getByText('Jane Doe'));

    expect(onRemove).not.toHaveBeenCalled();
  });
});
