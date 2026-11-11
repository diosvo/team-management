import { pick } from 'es-toolkit';

import { MATCH_STAT_FIELDS } from '@/utils/constants';

import { MOCK_ALICE, MOCK_DAN } from '@/test/mocks/user';
import { renderWithUI, screen, setupTestLifecycle } from '@/test/utilities';

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
                { ...pick(MOCK_ALICE, ['id', 'name']), jersey_number: 7 },
                { ...pick(MOCK_DAN, ['id', 'name']), jersey_number: null },
              ]
            : []
        }
        drafts={{ [MOCK_ALICE.id]: draft }}
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
      screen.getByRole('spinbutton', { name: `Points for ${MOCK_ALICE.name}` }),
    ).toBeInTheDocument();
  });

  test('shows the jersey number only when the player has one', () => {
    setup();

    expect(screen.getByText('7 -')).toBeInTheDocument();
    expect(screen.getByText(MOCK_DAN.name)).toBeInTheDocument();
    // A player without a draft starts at zero.
    expect(
      screen.getByRole('spinbutton', { name: `Points for ${MOCK_DAN.name}` }),
    ).toHaveValue('0');
  });

  test('reports edits of a stat cell', async () => {
    const { user } = setup();

    await user.type(
      screen.getByRole('spinbutton', { name: `Points for ${MOCK_ALICE.name}` }),
      '5',
    );

    expect(onChange).toHaveBeenLastCalledWith(
      MOCK_ALICE.id,
      'points_scored',
      '05',
    );
  });

  test('removes a player when their name is clicked', async () => {
    const { user } = setup();

    await user.click(screen.getByText(MOCK_ALICE.name));

    expect(onRemove).toHaveBeenCalledWith(MOCK_ALICE.id);
  });

  test('removes a player from the keyboard', async () => {
    const { user } = setup();

    screen.getByRole('button', { name: new RegExp(MOCK_ALICE.name) }).focus();
    await user.keyboard('{Enter}');
    expect(onRemove).toHaveBeenCalledWith(MOCK_ALICE.id);

    onRemove.mockClear();
    await user.keyboard(' ');
    expect(onRemove).toHaveBeenCalledWith(MOCK_ALICE.id);
  });

  test('ignores name clicks while disabled', async () => {
    const { user } = setup(true, true);

    await user.click(screen.getByText(MOCK_ALICE.name));

    expect(onRemove).not.toHaveBeenCalled();
  });
});
