import { MOCK_LEAGUE } from '@/test/mocks/league';
import { MOCK_USER, MOCK_USER_WITH_PLAYER } from '@/test/mocks/user';
import {
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

import type { League } from '@/drizzle/schema';
import type { User } from '@/drizzle/schema/user';

import { downloadCsv, downloadPdf } from '../_helpers/roster';
import PreviewPanel from './PreviewPanel';

// Reached indirectly through useTableState.
vi.mock('@/hooks/use-permissions', () => ({
  default: vi.fn(),
}));

vi.mock('@/components/ui/toaster', () => createToasterMock());

vi.mock('../_helpers/roster', async () => {
  const actual =
    await vi.importActual<typeof import('../_helpers/roster')>(
      '../_helpers/roster',
    );

  return { ...actual, downloadCsv: vi.fn(), downloadPdf: vi.fn() };
});

const buildPdf = vi.fn();
vi.mock('../_helpers/pdf', () => ({
  buildRegistrationPdf: (...args: Array<unknown>) => buildPdf(...args),
}));

describe('PreviewPanel', () => {
  const mockDownloadCsv = vi.mocked(downloadCsv);
  const mockDownloadPdf = vi.mocked(downloadPdf);
  const onSave = vi.fn();

  const players = [MOCK_USER_WITH_PLAYER as User];

  const setup = (
    overrides: Partial<{
      players: Array<User>;
      league?: League;
      template?: File;
    }> = {},
  ) => {
    const { players: given = players, template } = overrides;
    // `league: undefined` has to survive, so don't lean on a default here.
    const league = 'league' in overrides ? overrides.league : MOCK_LEAGUE;

    vi.mocked(usePermissions).mockReturnValue(createPermissionsMock());

    return renderWithUI(
      <PreviewPanel
        players={given}
        league={league}
        template={template}
        onSave={onSave}
      />,
    );
  };

  setupTestLifecycle();

  beforeEach(() => {
    buildPdf.mockResolvedValue({
      bytes: new Uint8Array([1, 2, 3]),
      filledCount: 3,
      detectedFields: ['name', 'dob', 'cmnd'],
    });
  });

  test('should be accessible', async () => {
    const { container } = setup();

    await expectNoA11yViolations(container);
  });

  test('renders the preview heading and actions', () => {
    setup();

    expect(screen.getByText('Preview')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /csv/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /pdf/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
  });

  describe('when nothing is selected yet', () => {
    test('shows the empty state without a league', () => {
      setup({ league: undefined });

      expect(screen.getByText('Nothing to preview yet')).toBeInTheDocument();
    });

    test('shows the empty state without players', () => {
      setup({ players: [] });

      expect(screen.getByText('Nothing to preview yet')).toBeInTheDocument();
    });

    test('disables every action', () => {
      setup({ players: [] });

      expect(screen.getByRole('button', { name: /csv/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /pdf/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /save/i })).toBeDisabled();
    });
  });

  describe('table preview', () => {
    test('renders a roster column for every field', () => {
      setup();

      ['#', 'Họ tên', 'Năm sinh', 'CCCD', 'Điện thoại', 'Số áo'].forEach(
        (header) => {
          expect(screen.getByText(header)).toBeInTheDocument();
        },
      );
    });

    test('renders a numbered row per player', () => {
      // The table keys rows by user id, so the second player needs its own.
      const second = {
        ...MOCK_USER,
        id: 'user-456',
        name: 'Second Player',
      } as User;

      setup({ players: [MOCK_USER_WITH_PLAYER as User, second] });

      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    test('notes that no template was uploaded', () => {
      setup();

      expect(
        screen.getByText(
          'No PDF uploaded - showing the registration as a table.',
        ),
      ).toBeInTheDocument();
    });
  });

  describe('downloads', () => {
    test('exports the roster as a CSV named after the league', async () => {
      const { user } = setup();

      await user.click(screen.getByRole('button', { name: /csv/i }));

      await waitFor(() => {
        expect(mockDownloadCsv).toHaveBeenCalledWith(players, 'sgr-summer-league');
      });
      expect(mockToaster.promise).toHaveBeenCalled();
    });

    test('builds the PDF on demand and downloads it', async () => {
      const { user } = setup();

      await user.click(screen.getByRole('button', { name: /pdf/i }));

      await waitFor(() => {
        expect(buildPdf).toHaveBeenCalledWith({
          players,
          league: MOCK_LEAGUE,
          template: undefined,
        });
      });
    });

    test('hands the generated bytes to downloadPdf on success', async () => {
      // toaster.promise is stubbed, so drive its success branch directly.
      mockToaster.promise.mockImplementation(
        async (promise: Promise<unknown>, options: any) => {
          options.success(await promise);
        },
      );

      const { user } = setup();

      await user.click(screen.getByRole('button', { name: /pdf/i }));

      await waitFor(() => {
        expect(mockDownloadPdf).toHaveBeenCalledWith(
          expect.any(Uint8Array),
          'sgr-summer-league',
        );
      });
    });

    test('warns when an uploaded template matched no player fields', async () => {
      buildPdf.mockResolvedValue({
        bytes: new Uint8Array([1]),
        filledCount: 0,
        detectedFields: ['a', 'b'],
      });

      let result: any;
      mockToaster.promise.mockImplementation(
        async (promise: Promise<unknown>, options: any) => {
          result = options.success(await promise);
        },
      );

      const template = new File(['pdf'], 'form.pdf', {
        type: 'application/pdf',
      });
      const { user } = setup({ template });

      await user.click(screen.getByRole('button', { name: /pdf/i }));

      await waitFor(() => {
        expect(result).toMatchObject({
          type: 'warning',
          title: 'No fields matched',
          description: 'Found 2 field(s) but none matched player data.',
        });
      });
    });
  });

  describe('with an uploaded template', () => {
    const template = new File(['pdf'], 'form.pdf', {
      type: 'application/pdf',
    });

    test('names the uploaded form in the footer', () => {
      setup({ template });

      expect(
        screen.getByText('Using uploaded form: form.pdf'),
      ).toBeInTheDocument();
    });

    test('renders the generated PDF in an iframe', async () => {
      setup({ template });

      expect(
        await screen.findByTitle('Registration preview'),
      ).toBeInTheDocument();
    });

    test('reports a failure to build the preview', async () => {
      buildPdf.mockRejectedValue(new Error('Encrypted PDF'));

      setup({ template });

      expect(await screen.findByText('Encrypted PDF')).toBeInTheDocument();
    });
  });

  test('saves through onSave', async () => {
    const { user } = setup();

    await user.click(screen.getByRole('button', { name: /save/i }));

    expect(onSave).toHaveBeenCalled();
  });
});
