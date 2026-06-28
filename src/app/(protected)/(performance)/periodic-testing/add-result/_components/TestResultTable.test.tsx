import * as nuqs from 'nuqs';
import { Mock } from 'vitest';

import {
  MOCK_TEST_CONFIGURATION,
  MOCK_TEST_PLAYER_2,
  MOCK_TEST_TYPE,
  MOCK_TEST_TYPE_2,
} from '@/test/mocks/periodic-testing';
import { MOCK_USER } from '@/test/mocks/user';
import { renderWithUI, screen } from '@/test/utilities';

import { TestConfigurationSelection } from '@/types/periodic-testing';

import TestResultTable from './TestResultTable';

describe('TestResultTable', () => {
  const setup = ({
    configuration = MOCK_TEST_CONFIGURATION,
    results = {},
  }: {
    configuration?: TestConfigurationSelection;
    results?: Record<string, string>;
  } = {}) => {
    const setSelection = vi.fn();
    const setResults = vi.fn();

    (nuqs.useQueryStates as unknown as Mock).mockReturnValue([
      { page: 1 },
      vi.fn(),
    ]);

    const view = renderWithUI(
      <TestResultTable
        configuration={configuration}
        setSelection={setSelection}
        results={results}
        setResults={setResults}
      />,
    );

    return { ...view, setSelection, setResults };
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders a column header with its unit for each type', () => {
    setup();

    expect(screen.getByText(MOCK_TEST_TYPE.name)).toBeInTheDocument();
    expect(screen.getByText(`(${MOCK_TEST_TYPE.unit})`)).toBeInTheDocument();
    expect(screen.getByText(MOCK_TEST_TYPE_2.name)).toBeInTheDocument();
  });

  test('renders a row for each player', () => {
    setup();

    expect(screen.getByText(MOCK_USER.name)).toBeInTheDocument();
    expect(screen.getByText(MOCK_TEST_PLAYER_2.name)).toBeInTheDocument();
  });

  test('shows the empty state when there are no players', () => {
    setup({ configuration: { ...MOCK_TEST_CONFIGURATION, players: [] } });

    expect(screen.getByText('No configuration set.')).toBeInTheDocument();
  });

  test('shows the empty state when there are no types', () => {
    setup({ configuration: { ...MOCK_TEST_CONFIGURATION, types: [] } });

    expect(screen.getByText('No configuration set.')).toBeInTheDocument();
  });

  test('removes a type when its column header is clicked', async () => {
    const { user, setSelection } = setup();

    await user.click(screen.getByText(MOCK_TEST_TYPE.name));

    const updater = setSelection.mock.calls.at(-1)?.[0];
    expect(updater(MOCK_TEST_CONFIGURATION).types).toEqual([MOCK_TEST_TYPE_2]);
  });

  test('removes a player when their name cell is clicked', async () => {
    const { user, setSelection } = setup();

    await user.click(screen.getByText(MOCK_USER.name));

    const updater = setSelection.mock.calls.at(-1)?.[0];
    expect(updater(MOCK_TEST_CONFIGURATION).players).toEqual([
      MOCK_TEST_PLAYER_2,
    ]);
  });

  test('records an entered score for the right player/type cell', async () => {
    const { user, setResults } = setup();

    const [firstCell] = screen.getAllByRole('spinbutton');
    await user.type(firstCell, '5');

    expect(setResults).toHaveBeenCalled();
    const updater = setResults.mock.calls.at(-1)?.[0];
    expect(updater({})).toHaveProperty(
      `${MOCK_USER.id}-${MOCK_TEST_TYPE.type_id}`,
    );
  });
});
