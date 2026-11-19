import { UserRole, UserState } from '@/utils/enum';

import { openSheetTab, type SheetTab } from '@/lib/google-drive';

import { saveJerseyOrderSheet } from '@/actions/jersey-order';
import type { JerseyOrderSheetLink } from '@/db/jersey-order';
import type { RosterUser } from '@/db/user';
import usePermissions from '@/hooks/use-permissions';
import {
  createPermissionsMock,
  createToasterMock,
  expectNoA11yViolations,
  fireEvent,
  renderWithUI,
  screen,
  setupTestLifecycle,
  waitFor,
} from '@/test/utilities';

import JerseyOrderExport from './JerseyOrderExport';

import {
  downloadJerseyOrder,
  openJerseyOrderInSheets,
} from '../_helpers/jersey-order';

vi.mock('../_helpers/jersey-order', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../_helpers/jersey-order')>()),
  downloadJerseyOrder: vi.fn(),
  openJerseyOrderInSheets: vi.fn(),
}));

vi.mock('@/lib/google-drive', () => ({ openSheetTab: vi.fn() }));

vi.mock('@/actions/jersey-order', () => ({
  saveJerseyOrderSheet: vi.fn(async () => ({ success: true, message: '' })),
}));

vi.mock('@/components/ui/toaster', () => createToasterMock());

vi.mock('@/hooks/use-permissions', () => ({ default: vi.fn() }));

import { toaster } from '@/components/ui/toaster';

const user = (overrides: Partial<RosterUser>): RosterUser => ({
  id: 'user-1',
  name: 'Thu',
  email: 'thu@example.com',
  emailVerified: true,
  role: UserRole.PLAYER,
  state: UserState.ACTIVE,
  player: {
    jersey_number: 11,
    jersey_name: 'Kitu',
    shirt_size: 'M',
    short_size: null,
    short_form: 'short',
    position: null,
  },
  ...overrides,
});

const CAPTAIN = user({
  id: 'user-4',
  name: 'Captain',
  email: 'captain@example.com',
  player: {
    jersey_number: 4,
    jersey_name: null,
    shirt_size: null,
    short_size: null,
    short_form: null,
    position: null,
  },
});

const USERS = [
  user({}),
  CAPTAIN,
  user({ id: 'user-2', name: 'Inactive', state: UserState.INACTIVE }),
  user({ id: 'user-3', name: 'Coach', role: UserRole.COACH, player: null }),
];

describe('JerseyOrderExport', () => {
  const mockDownload = vi.mocked(downloadJerseyOrder);

  const mockOpen = vi.mocked(openJerseyOrderInSheets);
  const mockUsePermissions = vi.mocked(usePermissions);

  beforeEach(() => {
    mockUsePermissions.mockReturnValue(
      createPermissionsMock({ isAdmin: true }),
    );
  });

  const openDialog = async (
    googleClientId?: string,
    sheet: Nullable<JerseyOrderSheetLink> = null,
  ) => {
    const view = renderWithUI(
      <JerseyOrderExport
        users={USERS}
        googleClientId={googleClientId}
        sheet={sheet}
        paymentEditors={['admin@example.com', 'captain@example.com']}
      />,
    );
    await view.user.click(screen.getByRole('button', { name: /Jersey form/ }));
    await screen.findByText('Jersey order form');
    return view;
  };

  setupTestLifecycle();

  test('should be accessible', async () => {
    await openDialog();

    await expectNoA11yViolations();
  });

  test('downloads with the active players, provider and default price', async () => {
    const { user: actor } = await openDialog();

    await actor.click(screen.getByRole('button', { name: /Download/ }));

    await waitFor(() =>
      expect(mockDownload).toHaveBeenCalledWith({
        players: [
          {
            name: 'Thu',
            jersey_number: 11,
            jersey_name: 'Kitu',
            shirt_size: 'M',
            short_size: null,
            short_form: 'short',
          },
          {
            name: 'Captain',
            jersey_number: 4,
            jersey_name: null,
            shirt_size: null,
            short_size: null,
            short_form: null,
          },
        ],
        provider: 'Hoops',
        price: 360_000,
      }),
    );
  });

  test('downloads with the picked provider and price', async () => {
    const { user: actor } = await openDialog();

    await actor.click(
      screen.getByRole('combobox', { name: 'Uniform provider' }),
    );
    await actor.click(await screen.findByRole('option', { name: 'Versus' }));
    const price = screen.getByRole('spinbutton', {
      name: 'Default price per jersey (VND)',
    });
    await actor.clear(price);
    await actor.type(price, '400000');
    await actor.click(screen.getByRole('button', { name: /Download/ }));

    await waitFor(() =>
      expect(mockDownload).toHaveBeenCalledWith(
        expect.objectContaining({ provider: 'Versus', price: 400_000 }),
      ),
    );
  });

  test('treats a cleared price as free', async () => {
    const { user: actor } = await openDialog();

    await actor.clear(
      screen.getByRole('spinbutton', {
        name: 'Default price per jersey (VND)',
      }),
    );
    await actor.click(screen.getByRole('button', { name: /Download/ }));

    await waitFor(() =>
      expect(mockDownload).toHaveBeenCalledWith(
        expect.objectContaining({ price: 0 }),
      ),
    );
  });

  test('keeps the provider when the selection is emptied', async () => {
    const { user: actor } = await openDialog();
    const select = document.querySelector<HTMLSelectElement>(
      'select[aria-hidden]',
    )!;

    select.value = '';
    fireEvent.change(select);
    await actor.click(screen.getByRole('button', { name: /Download/ }));

    await waitFor(() =>
      expect(mockDownload).toHaveBeenCalledWith(
        expect.objectContaining({ provider: 'Hoops' }),
      ),
    );
  });

  test('shows an error toast when the export fails', async () => {
    mockDownload.mockRejectedValueOnce(new Error('boom'));
    const { user: actor } = await openDialog();

    await actor.click(screen.getByRole('button', { name: /Download/ }));

    await waitFor(() =>
      expect(toaster.create).toHaveBeenCalledWith({
        type: 'error',
        title: 'Could not build the jersey form.',
      }),
    );
  });

  test('hides Google Sheets when it is not configured', async () => {
    await openDialog();

    expect(
      screen.queryByRole('button', { name: /Open in Google Sheets/ }),
    ).not.toBeInTheDocument();
  });

  describe('Open in Google Sheets', () => {
    const mockOpenSheetTab = vi.mocked(openSheetTab);
    let tab: SheetTab;

    beforeEach(() => {
      tab = { token: Promise.resolve('token'), open: vi.fn(), fail: vi.fn() };
      mockOpenSheetTab.mockReturnValue(tab);
    });

    const clickOpen = async () => {
      const { user: actor } = await openDialog('client-id');
      await actor.click(
        screen.getByRole('button', { name: /Open in Google Sheets/ }),
      );
    };

    test('opens the tab on click and sends it to the uploaded sheet', async () => {
      mockOpen.mockImplementationOnce(async (_, getToken) => {
        expect(await getToken()).toBe('token');
        return {
          id: 'abc',
          url: 'https://sheet',
          checkboxes: true,
          protected: true,
          shared: true,
        };
      });

      await clickOpen();

      expect(mockOpenSheetTab).toHaveBeenCalledWith('client-id');
      await waitFor(() =>
        expect(tab.open).toHaveBeenCalledWith('https://sheet'),
      );
      expect(toaster.create).not.toHaveBeenCalled();
      await waitFor(() =>
        expect(saveJerseyOrderSheet).toHaveBeenCalledWith('abc'),
      );
    });

    test('locks payments to the super admin and captains', async () => {
      mockOpen.mockResolvedValueOnce({
        id: 'abc',
        url: 'https://sheet',
        checkboxes: true,
        protected: true,
        shared: true,
      });

      await clickOpen();

      await waitFor(() =>
        expect(mockOpen).toHaveBeenCalledWith(
          expect.anything(),
          expect.any(Function),
          ['admin@example.com', 'captain@example.com'],
        ),
      );
      expect(
        screen.queryByRole('textbox', { name: /Who can tick/ }),
      ).not.toBeInTheDocument();
    });

    test('warns when the paid column could not be locked', async () => {
      mockOpen.mockResolvedValueOnce({
        id: 'abc',
        url: 'https://sheet',
        checkboxes: true,
        protected: false,
        shared: true,
      });

      await clickOpen();

      await waitFor(() =>
        expect(toaster.create).toHaveBeenCalledWith({
          type: 'warning',
          title: expect.stringContaining('not locked'),
        }),
      );
    });

    test('explains when the browser blocks the tab', async () => {
      mockOpenSheetTab.mockReturnValue(null);

      await clickOpen();

      expect(toaster.create).toHaveBeenCalledWith({
        type: 'error',
        title: expect.stringContaining('blocked the new tab'),
      });
      expect(mockOpen).not.toHaveBeenCalled();
    });

    test('tells the tab and the user when the upload fails', async () => {
      mockOpen.mockRejectedValueOnce(new Error('access_denied'));

      await clickOpen();

      await waitFor(() =>
        expect(toaster.create).toHaveBeenCalledWith({
          type: 'error',
          title: 'Could not open the form in Google Sheets.',
        }),
      );
      expect(tab.fail).toHaveBeenCalledWith('access_denied');
      expect(tab.open).not.toHaveBeenCalled();
    });

    test('tells the tab without a reason when the failure is not an Error', async () => {
      mockOpen.mockRejectedValueOnce('offline');

      await clickOpen();

      await waitFor(() => expect(tab.fail).toHaveBeenCalledWith(undefined));
    });

    test('still opens the sheet when remembering it fails', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      vi.mocked(saveJerseyOrderSheet).mockResolvedValueOnce({
        success: false,
        message: 'Database down',
      });
      mockOpen.mockResolvedValueOnce({
        id: 'abc',
        url: 'https://sheet',
        checkboxes: true,
        protected: true,
        shared: true,
      });

      await clickOpen();

      await waitFor(() =>
        expect(warn).toHaveBeenCalledWith('[jersey-order]', 'Database down'),
      );
      expect(tab.open).toHaveBeenCalledWith('https://sheet');
    });

    test('still opens the sheet but warns when the link is private', async () => {
      mockOpen.mockResolvedValueOnce({
        id: 'abc',
        url: 'https://sheet',
        checkboxes: true,
        protected: true,
        shared: false,
      });

      await clickOpen();

      await waitFor(() =>
        expect(toaster.create).toHaveBeenCalledWith({
          type: 'warning',
          title: expect.stringContaining('not public'),
        }),
      );
      expect(tab.open).toHaveBeenCalledWith('https://sheet');
    });

    test('still opens the sheet but warns when checkboxes are missing', async () => {
      mockOpen.mockResolvedValueOnce({
        id: 'abc',
        url: 'https://sheet',
        checkboxes: false,
        protected: true,
        shared: true,
      });

      await clickOpen();

      await waitFor(() =>
        expect(toaster.create).toHaveBeenCalledWith({
          type: 'warning',
          title: expect.stringContaining('Google Sheets API'),
        }),
      );
      expect(tab.open).toHaveBeenCalledWith('https://sheet');
    });
  });

  test.each([
    ['the super admin', { isAdmin: true }],
    ['the captain', { isCaptain: true }],
  ])('shows the trigger for %s', (_, permissions) => {
    mockUsePermissions.mockReturnValue(createPermissionsMock(permissions));

    renderWithUI(<JerseyOrderExport users={USERS} />);

    expect(
      screen.getByRole('button', { name: /Jersey form/ }),
    ).toBeInTheDocument();
  });

  test('hides the trigger from other members', () => {
    mockUsePermissions.mockReturnValue(
      createPermissionsMock({ isPlayer: true }),
    );

    renderWithUI(<JerseyOrderExport users={USERS} />);

    expect(
      screen.queryByRole('button', { name: /Jersey form/ }),
    ).not.toBeInTheDocument();
  });

  describe("when this year's sheet exists", () => {
    const SHEET = {
      url: 'https://docs.google.com/spreadsheets/d/old/edit',
      updated_at: new Date('2026-11-10'),
    };

    test('links to it and offers a new one as the alternative', async () => {
      await openDialog('client-id', SHEET);

      expect(
        screen.getByText(/This year's sheet was created on/),
      ).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Open sheet/ })).toHaveAttribute(
        'href',
        SHEET.url,
      );
      expect(screen.getByRole('link', { name: /Open sheet/ })).toHaveAttribute(
        'target',
        '_blank',
      );
      expect(
        screen.getByRole('button', { name: /Create new/ }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: /Open in Google Sheets/ }),
      ).not.toBeInTheDocument();
    });

    test('still links to it without Google configured', async () => {
      await openDialog(undefined, SHEET);

      expect(
        screen.getByRole('link', { name: /Open sheet/ }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: /Create new/ }),
      ).not.toBeInTheDocument();
    });
  });
});
