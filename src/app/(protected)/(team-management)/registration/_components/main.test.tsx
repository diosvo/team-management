import { MOCK_LEAGUE } from '@/test/mocks/league';
import { MOCK_USER_WITH_PLAYER } from '@/test/mocks/user';
import {
  axeDecorativeSteps,
  createPermissionsMock,
  createToasterMock,
  expectNoA11yViolations,
  mockToaster,
  renderWithUI,
  screen,
  setupTestLifecycle,
  waitFor,
} from '@/test/utilities';

import usePermissions from '@/hooks/use-permissions';

import type { User } from '@/drizzle/schema/user';

import { useSavedRegistrations } from '../_helpers/useSavedRegistrations';
import RegistrationPageClient from './main';

vi.mock('@/hooks/use-permissions', () => ({
  default: vi.fn(),
}));

vi.mock('@/components/ui/toaster', () => createToasterMock());

vi.mock('@/actions/league', () => ({
  getLeagues: vi.fn(),
}));

vi.mock('../_helpers/useSavedRegistrations', () => ({
  useSavedRegistrations: vi.fn(),
}));

const buildPdf = vi.fn();
vi.mock('../_helpers/pdf', () => ({
  buildRegistrationPdf: (...args: Array<unknown>) => buildPdf(...args),
}));

// The player and league pickers are covered by their own tests; expose plain
// buttons so this test can drive the page's own state.
vi.mock('@/components/user/PlayerSelection', () => ({
  PlayerSelectionWithActions: ({
    disabled,
    onSelectionChange,
  }: {
    disabled: boolean;
    onSelectionChange: (players: Array<User>) => void;
  }) => (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onSelectionChange([MOCK_USER_WITH_PLAYER as User])}
    >
      PlayerSelection
    </button>
  ),
  SelectedPlayers: ({ selection }: { selection: Array<User> }) => (
    <div data-testid="selected-players">{selection.length}</div>
  ),
}));

vi.mock('@/components/SearchableSelect', () => ({
  default: ({ onChange }: { onChange: (item: unknown) => void }) => (
    <button type="button" onClick={() => onChange(MOCK_LEAGUE)}>
      LeagueSelect
    </button>
  ),
}));

vi.mock('./PreviewPanel', () => ({
  default: ({ onSave }: { onSave: () => void }) => (
    <button type="button" onClick={onSave}>
      SavePreview
    </button>
  ),
}));

vi.mock('./SavedRegistrations', () => ({
  default: ({ items }: { items: Array<unknown> }) => (
    <div data-testid="saved-registrations">{items.length}</div>
  ),
}));

describe('RegistrationPageClient', () => {
  const save = vi.fn();
  const remove = vi.fn();
  const getUniqueName = vi.fn((name: string) => name);

  const setup = ({
    isAdmin = true,
    isCaptain = false,
    saved = [],
  }: Partial<{
    isAdmin: boolean;
    isCaptain: boolean;
    saved: Array<unknown>;
  }> = {}) => {
    vi.mocked(usePermissions).mockReturnValue(
      createPermissionsMock({ isAdmin, isCaptain }),
    );
    vi.mocked(useSavedRegistrations).mockReturnValue({
      items: saved,
      save,
      remove,
      getUniqueName,
    } as unknown as ReturnType<typeof useSavedRegistrations>);

    return renderWithUI(<RegistrationPageClient />);
  };

  setupTestLifecycle();

  beforeEach(() => {
    getUniqueName.mockImplementation((name: string) => name);
    buildPdf.mockResolvedValue({ bytes: new Uint8Array([1, 2, 3]) });
  });

  test('should be accessible', async () => {
    const { container } = setup();

    await expectNoA11yViolations(container, axeDecorativeSteps);
  });

  test('renders each section of the flow', () => {
    setup();

    expect(screen.getByText('Select players')).toBeInTheDocument();
    expect(screen.getByText('Choose a league')).toBeInTheDocument();
    expect(screen.getByText('Notes')).toBeInTheDocument();
    // Also the title of the third step, hence the plural query.
    expect(screen.getAllByText('Attach PDF').length).toBeGreaterThan(0);
  });

  test('renders the step indicator', () => {
    setup();

    ['Choose players', 'Pick league', 'Review & Export'].forEach((title) => {
      expect(screen.getByText(title, { exact: false })).toBeInTheDocument();
    });
  });

  test('starts with nothing selected', () => {
    setup();

    expect(screen.getByText('0 selected')).toBeInTheDocument();
    expect(screen.getByTestId('selected-players')).toHaveTextContent('0');
  });

  test('counts the players once they are selected', async () => {
    const { user } = setup();

    await user.click(screen.getByRole('button', { name: 'PlayerSelection' }));

    expect(screen.getByText('1 selected')).toBeInTheDocument();
    expect(screen.getByTestId('selected-players')).toHaveTextContent('1');
  });

  test('passes the saved registrations straight through', () => {
    setup({ saved: [{ id: 'saved-1' }, { id: 'saved-2' }] });

    expect(screen.getByTestId('saved-registrations')).toHaveTextContent('2');
  });

  describe('permissions', () => {
    test('lets a captain edit the registration', () => {
      setup({ isAdmin: false, isCaptain: true });

      expect(
        screen.getByRole('button', { name: 'PlayerSelection' }),
      ).toBeEnabled();
    });

    test('locks the inputs for anyone else', () => {
      setup({ isAdmin: false, isCaptain: false });

      expect(
        screen.getByRole('button', { name: 'PlayerSelection' }),
      ).toBeDisabled();
      expect(
        screen.getByPlaceholderText('Internal notes about this registration…'),
      ).toBeDisabled();
    });
  });

  describe('notes', () => {
    test('tracks the character count', async () => {
      const { user } = setup();

      await user.type(
        screen.getByPlaceholderText('Internal notes about this registration…'),
        'Bring jerseys',
      );

      expect(screen.getByText('13/256')).toBeInTheDocument();
    });
  });

  describe('saving', () => {
    const selectPlayersAndLeague = async (
      user: ReturnType<typeof setup>['user'],
    ) => {
      await user.click(screen.getByRole('button', { name: 'PlayerSelection' }));
      await user.click(screen.getByRole('button', { name: 'LeagueSelect' }));
    };

    test('does nothing without a league or players', async () => {
      const { user } = setup();

      await user.click(screen.getByRole('button', { name: 'SavePreview' }));

      expect(buildPdf).not.toHaveBeenCalled();
      expect(save).not.toHaveBeenCalled();
    });

    test('builds a PDF and stores it base64-encoded', async () => {
      const { user } = setup();

      await selectPlayersAndLeague(user);
      await user.click(screen.getByRole('button', { name: 'SavePreview' }));

      await waitFor(() => {
        expect(save).toHaveBeenCalledWith(
          expect.objectContaining({
            leagueName: MOCK_LEAGUE.name,
            playerCount: 1,
            filename: 'saigon-rovers-summer-league',
            pdfBase64: expect.any(String),
          }),
        );
      });
      expect(mockToaster.success).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Registration saved' }),
      );
    });

    test('deduplicates the saved name', async () => {
      getUniqueName.mockReturnValue('Summer League (2)');

      const { user } = setup();

      await selectPlayersAndLeague(user);
      await user.click(screen.getByRole('button', { name: 'SavePreview' }));

      await waitFor(() => {
        expect(getUniqueName).toHaveBeenCalledWith(MOCK_LEAGUE.name);
        expect(save).toHaveBeenCalledWith(
          expect.objectContaining({
            leagueName: 'Summer League (2)',
            filename: 'saigon-rovers-summer-league-(2)',
          }),
        );
      });
    });

    test('reports a failure to build the PDF', async () => {
      buildPdf.mockRejectedValue(new Error('Encrypted PDF'));

      const { user } = setup();

      await selectPlayersAndLeague(user);
      await user.click(screen.getByRole('button', { name: 'SavePreview' }));

      await waitFor(() => {
        expect(mockToaster.error).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Could not save registration',
            description: 'Encrypted PDF',
          }),
        );
      });
      expect(save).not.toHaveBeenCalled();
    });
  });
});
