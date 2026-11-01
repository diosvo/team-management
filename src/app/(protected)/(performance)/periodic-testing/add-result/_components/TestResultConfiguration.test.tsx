import {
  expectNoA11yViolations,
  renderWithUI,
  screen,
  setupTestLifecycle,
  waitFor,
} from '@/test/utilities';
import { formatDate } from '@/utils/datetime';

import {
  MOCK_EMPTY_TEST_CONFIGURATION,
  MOCK_TEST_RESULT_DATE,
  MOCK_TEST_TYPE,
} from '@/test/mocks/periodic-testing';
import { MOCK_USER } from '@/test/mocks/user';

import TestResultConfiguration from './TestResultConfiguration';

// The player and type selectors have their own tests; expose their callbacks
// through simple markers so this test can drive the selection wiring.
vi.mock('@/components/user/PlayerSelection', () => ({
  PlayerSelectionWithActions: ({
    onSelectionChange,
  }: {
    onSelectionChange: (players: Array<unknown>) => void;
  }) => (
    <button onClick={() => onSelectionChange([MOCK_USER])}>
      select players
    </button>
  ),
}));

vi.mock('@/components/SearchableSelect', () => ({
  default: ({
    onChange,
    renderItem,
    itemToString,
    itemToValue,
  }: {
    onChange: (types: Array<unknown>) => void;
    renderItem: (item: typeof MOCK_TEST_TYPE) => React.ReactNode;
    itemToString: (item: typeof MOCK_TEST_TYPE) => string;
    itemToValue: (item: typeof MOCK_TEST_TYPE) => string;
  }) => (
    <>
      {renderItem(MOCK_TEST_TYPE)}
      {itemToString(MOCK_TEST_TYPE)}
      {itemToValue(MOCK_TEST_TYPE)}
      <button onClick={() => onChange([MOCK_TEST_TYPE])}>select types</button>
    </>
  ),
}));

vi.mock('@/actions/test-type', () => ({
  getTestTypes: vi.fn(),
}));

describe('TestResultConfiguration', () => {
  const setup = (selection = MOCK_EMPTY_TEST_CONFIGURATION) => {
    const setSelection = vi.fn();
    const view = renderWithUI(
      <TestResultConfiguration
        selection={selection}
        setSelection={setSelection}
      />,
    );
    return { ...view, setSelection };
  };

  // The updater passed to setSelection is functional; apply it to inspect.
  const applyUpdater = (setSelection: ReturnType<typeof vi.fn>) => {
    const updater = setSelection.mock.calls.at(-1)?.[0];
    return updater(MOCK_EMPTY_TEST_CONFIGURATION);
  };

  setupTestLifecycle();

  test('should be accessible', async () => {
    const { container } = setup();

    await expectNoA11yViolations(container);
  });

  test('renders the test date field', () => {
    setup();

    expect(screen.getByText('Test Date')).toBeInTheDocument();
  });

  test('updates the players when the player selector changes', async () => {
    const { user, setSelection } = setup();

    await user.click(screen.getByText('select players'));

    expect(applyUpdater(setSelection)).toMatchObject({ players: [MOCK_USER] });
  });

  test('updates the types when the type selector changes', async () => {
    const { user, setSelection } = setup();

    await user.click(screen.getByText('select types'));

    expect(applyUpdater(setSelection)).toMatchObject({
      types: [MOCK_TEST_TYPE],
    });
  });

  test('updates the date when the date input changes', async () => {
    const { user, setSelection } = setup();

    // The picker shows the locale format, but still reports an ISO day.
    const input = screen.getByDisplayValue(formatDate(MOCK_TEST_RESULT_DATE));
    await user.clear(input);
    await user.type(input, '02/02/2026');
    // The picker commits the typed value on blur.
    await user.tab();

    await waitFor(() =>
      expect(applyUpdater(setSelection)).toMatchObject({ date: '2026-02-02' }),
    );
  });
});
