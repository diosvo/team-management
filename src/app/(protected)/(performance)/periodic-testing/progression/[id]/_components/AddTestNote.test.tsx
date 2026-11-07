import { saveTestNote } from '@/actions/progression';
import type { TestType } from '@/drizzle/schema';
import {
  MOCK_GENERAL_NOTE,
  MOCK_PLAYER_PROGRESSION,
  MOCK_PROGRESSION_TYPE,
  MOCK_PROGRESSION_TYPE_TIMED,
  MOCK_TEST_NOTE,
} from '@/test/mocks/progression';
import {
  act,
  createToasterMock,
  expectNoA11yViolations,
  renderWithUI,
  screen,
  setupTestLifecycle,
  waitFor,
} from '@/test/utilities';

import { AddTestNote } from './AddTestNote';

vi.mock('@/actions/progression', () => ({
  saveTestNote: vi.fn(),
}));
vi.mock('@/components/ui/toaster', () => createToasterMock());

// A type without a unit exercises the unit-less goal label.
const UNITLESS: TestType = {
  ...MOCK_PROGRESSION_TYPE_TIMED,
  type_id: 'type-unitless',
  name: 'Agility',
  unit: '' as never,
};

describe('AddTestNote', () => {
  const mockCreate = vi.mocked(saveTestNote);

  const open = async (
    extra: Partial<Parameters<typeof AddTestNote.open>[1]> = {},
  ) => {
    const view = renderWithUI(<AddTestNote.Viewport />);
    await act(async () => {
      AddTestNote.open('add-test-note', {
        playerId: MOCK_PLAYER_PROGRESSION.player_id,
        types: [MOCK_PROGRESSION_TYPE, UNITLESS],
        ...extra,
      });
    });
    return view;
  };

  const optionNames = async (user: ReturnType<typeof renderWithUI>['user']) => {
    await user.click(screen.getByRole('combobox'));
    const items = await screen.findAllByRole('option', { hidden: true });
    return items
      .filter((el) => el.dataset.part === 'item')
      .map((el) => el.textContent);
  };

  // Chakra Select: open the trigger, then click the option.
  const pick = async (
    user: ReturnType<typeof renderWithUI>['user'],
    name: string,
  ) => {
    await user.click(screen.getByRole('combobox'));
    const options = await screen.findAllByRole('option', {
      name,
      hidden: true,
    });
    // Skip the native <option> of Select.HiddenSelect; click the Chakra item.
    await user.click(options.find((el) => el.dataset.part === 'item')!);
  };

  setupTestLifecycle();

  afterEach(() => {
    act(() => {
      AddTestNote.removeAll();
    });
  });

  test('should be accessible', async () => {
    await open();

    await expectNoA11yViolations();
  });

  test('validates the observation and the goal', async () => {
    const { user } = await open();

    await user.type(await screen.findByRole('textbox'), 'ab');
    expect(
      await screen.findByText('Be at least 3 characters long.'),
    ).toBeInTheDocument();

    // The goal only appears once a focus area is picked.
    expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();
    await pick(user, 'Push-ups');
    expect(screen.getByText('Goal for Next Test (reps)')).toBeInTheDocument();
    await user.type(screen.getByRole('spinbutton'), '-1');
    expect(
      await screen.findByText('Be a positive number.'),
    ).toBeInTheDocument();

    await pick(user, 'Agility');
    expect(screen.getByText('Goal for Next Test')).toBeInTheDocument();

    // Back to a general note hides the goal again.
    await pick(user, 'General');
    await waitFor(() =>
      expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument(),
    );
  });

  test('saves the note, then closes', async () => {
    mockCreate.mockResolvedValue({ success: true, message: 'Saved' } as never);
    const { user } = await open();

    await user.type(await screen.findByRole('textbox'), MOCK_TEST_NOTE.content);
    const submit = screen.getByRole('button', { name: /save/i });
    await waitFor(() => expect(submit).toBeEnabled());
    await user.click(submit);

    await waitFor(() =>
      expect(mockCreate).toHaveBeenCalledWith(
        MOCK_PLAYER_PROGRESSION.player_id,
        expect.objectContaining({
          content: MOCK_TEST_NOTE.content,
          type_id: '',
        }),
        undefined,
      ),
    );
    await waitFor(() =>
      expect(
        screen.queryByText(MOCK_TEST_NOTE.content),
      ).not.toBeInTheDocument(),
    );
  });

  test('keeps the dialog open when saving fails', async () => {
    mockCreate.mockResolvedValue({ success: false, message: 'Nope' } as never);
    const { user } = await open();

    await user.type(await screen.findByRole('textbox'), MOCK_TEST_NOTE.content);
    const submit = screen.getByRole('button', { name: /save/i });
    await waitFor(() => expect(submit).toBeEnabled());
    await user.click(submit);

    await waitFor(() => expect(mockCreate).toHaveBeenCalled());
    expect(screen.getByRole('textbox')).toHaveValue(MOCK_TEST_NOTE.content);
  });

  test('leaves out focus areas that already have a note', async () => {
    const { user } = await open({
      usedTypeIds: [MOCK_PROGRESSION_TYPE.type_id],
    });

    expect(await optionNames(user)).toEqual(['General', 'Agility']);
  });

  test('edits a typed note: own focus area kept, values prefilled', async () => {
    mockCreate.mockResolvedValue({ success: true, message: 'Saved' } as never);
    const { user } = await open({
      usedTypeIds: [MOCK_PROGRESSION_TYPE.type_id],
      note: MOCK_TEST_NOTE,
    });

    expect(screen.getByText('Edit Note')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveValue(MOCK_TEST_NOTE.content);
    expect(screen.getByRole('spinbutton')).toHaveValue(MOCK_TEST_NOTE.goal);
    expect(await optionNames(user)).toEqual(['General', 'Push-ups', 'Agility']);
    await user.keyboard('{Escape}');

    const submit = screen.getByRole('button', { name: /save/i });
    await waitFor(() => expect(submit).toBeEnabled());
    await user.click(submit);

    await waitFor(() =>
      expect(mockCreate).toHaveBeenCalledWith(
        MOCK_PLAYER_PROGRESSION.player_id,
        expect.objectContaining({
          type_id: MOCK_PROGRESSION_TYPE.type_id,
          goal: String(MOCK_TEST_NOTE.goal),
        }),
        MOCK_TEST_NOTE.note_id,
      ),
    );
  });

  test('edits a general note without a goal', async () => {
    await open({ note: MOCK_GENERAL_NOTE });

    expect(screen.getByText('Edit Note')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveValue(MOCK_GENERAL_NOTE.content);
    expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();
  });
});
