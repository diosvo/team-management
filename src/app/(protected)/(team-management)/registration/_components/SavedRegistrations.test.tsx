import { head, last } from 'es-toolkit';
import { nth } from 'es-toolkit/compat';

import usePermissions from '@/hooks/use-permissions';
import { MOCK_SAVED_REGISTRATION } from '@/test/mocks/registration';
import {
  act,
  createPermissionsMock,
  createToasterMock,
  mockToaster,
  mockUseQueryStates,
  renderWithUI,
  screen,
  setupTestLifecycle,
  waitFor,
  within,
} from '@/test/utilities';

import SavedRegistrations from './SavedRegistrations';

import { downloadPdf } from '../_helpers/roster';
import type { SavedRegistration } from '../_helpers/use-saved-registrations';

// Reached indirectly through useTableState.
vi.mock('@/hooks/use-permissions', () => ({
  default: vi.fn(),
}));

vi.mock('@/components/ui/toaster', () => createToasterMock());

vi.mock('../_helpers/roster', () => ({
  downloadPdf: vi.fn(),
}));

describe('SavedRegistrations', () => {
  const mockDownloadPdf = vi.mocked(downloadPdf);
  const onRemove = vi.fn();

  const SAVED = MOCK_SAVED_REGISTRATION;

  const LEGACY_SAVED: SavedRegistration = {
    ...SAVED,
    id: 'saved-2',
    leagueName: 'Winter League',
    playerCount: 8,
    // Saved before downloads were supported.
    pdfBase64: '',
  };

  const setup = ({
    items = [SAVED, LEGACY_SAVED],
    params = {},
  }: Partial<{
    items: Array<SavedRegistration>;
    params: Record<string, unknown>;
  }> = {}) => {
    vi.mocked(usePermissions).mockReturnValue(createPermissionsMock());
    mockUseQueryStates({ page: 1, q: '', ...params });

    return renderWithUI(
      <SavedRegistrations items={items} onRemove={onRemove} />,
    );
  };

  const rowOf = (item: SavedRegistration) =>
    within(screen.getByText(item.leagueName).closest('tr')!);

  setupTestLifecycle();

  test('renders the card heading', () => {
    setup();

    expect(screen.getByText('Saved registrations')).toBeInTheDocument();
    expect(
      screen.getByText('Recent league registrations you have saved.'),
    ).toBeInTheDocument();
  });

  test('renders a row for each saved registration', () => {
    setup();

    expect(screen.getByText(SAVED.leagueName)).toBeInTheDocument();
    expect(screen.getByText(LEGACY_SAVED.leagueName)).toBeInTheDocument();
  });

  test('renders the column headers', () => {
    setup();

    ['Name', 'Players', 'Date saved', 'Actions'].forEach((header) => {
      expect(screen.getByText(header)).toBeInTheDocument();
    });
  });

  test('renders the player count of a registration', () => {
    setup({ items: [SAVED] });

    expect(screen.getByText(String(SAVED.playerCount))).toBeInTheDocument();
  });

  test('shows the empty state when nothing has been saved', () => {
    setup({ items: [] });

    expect(screen.getByText('No saved registrations yet')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Click Save in the preview to keep a registration here.',
      ),
    ).toBeInTheDocument();
  });

  test('filters the registrations by league name', () => {
    setup({ params: { q: 'winter' } });

    // HighlightText splits the matched substring into its own node.
    expect(screen.getByText('Winter', { exact: false })).toBeInTheDocument();
    expect(screen.queryByText(SAVED.leagueName)).not.toBeInTheDocument();
  });

  describe('download', () => {
    test('decodes the stored PDF and hands it to downloadPdf', async () => {
      const { user } = setup({ items: [SAVED] });

      const download = head(rowOf(SAVED).getAllByRole('button'))!;
      await user.click(download);

      await waitFor(() => {
        expect(mockDownloadPdf).toHaveBeenCalledWith(
          expect.any(Uint8Array),
          SAVED.filename,
        );
      });
      expect(mockToaster.promise).toHaveBeenCalled();
    });

    test('falls back to a default filename when none was stored', async () => {
      // Entries read back from older localStorage data may lack a filename.
      const { filename: _filename, ...rest } = SAVED;
      const unnamed = rest as SavedRegistration;
      const { user } = setup({ items: [unnamed] });

      const download = head(rowOf(unnamed).getAllByRole('button'))!;
      await user.click(download);

      await waitFor(() => {
        expect(mockDownloadPdf).toHaveBeenCalledWith(
          expect.any(Uint8Array),
          'registration',
        );
      });
    });

    test('locks the row actions while downloading and unlocks them after', async () => {
      let settle!: () => void;
      mockToaster.promise.mockImplementationOnce(
        async (promise: Promise<unknown>, options: any) => {
          await promise;
          await new Promise<void>((resolve) => (settle = resolve));
          options.finally();
        },
      );

      const { user } = setup({ items: [SAVED] });

      const buttons = rowOf(SAVED).getAllByRole('button');
      const download = head(buttons)!;
      const remove = nth(buttons, 1)!;
      await user.click(download);

      await waitFor(() => expect(remove).toBeDisabled());

      await act(async () => settle());

      await waitFor(() => expect(remove).toBeEnabled());
      expect(download).toBeEnabled();
    });

    test('hides the download action for a registration saved without a PDF', () => {
      setup({ items: [LEGACY_SAVED] });

      // Only the remove action stays visible.
      const [download] = rowOf(LEGACY_SAVED).getAllByRole('button', {
        hidden: true,
      });
      expect(download).not.toBeVisible();
    });
  });

  test('removes a registration through onRemove', async () => {
    const { user } = setup({ items: [SAVED] });

    const buttons = rowOf(SAVED).getAllByRole('button');
    await user.click(last(buttons)!);

    await waitFor(() => expect(onRemove).toHaveBeenCalledWith(SAVED.id));
    expect(mockToaster.promise).toHaveBeenCalled();
  });

  test('reports a failed removal with its message', async () => {
    onRemove.mockImplementationOnce(() => {
      throw new Error('Storage is full');
    });

    let result: any;
    mockToaster.promise.mockImplementationOnce(
      async (promise: Promise<unknown>, options: any) => {
        await promise.catch((error) => {
          result = options.error(error);
        });
      },
    );

    const { user } = setup({ items: [SAVED] });

    const buttons = rowOf(SAVED).getAllByRole('button');
    await user.click(last(buttons)!);

    await waitFor(() => {
      expect(result).toEqual({
        title: 'Could not remove',
        description: 'Storage is full',
      });
    });
  });

  test('falls back to a generic message for a non-Error removal failure', async () => {
    const { user } = setup({ items: [SAVED] });

    const buttons = rowOf(SAVED).getAllByRole('button');
    await user.click(last(buttons)!);

    const [, options] = mockToaster.promise.mock.calls[0] as Array<any>;
    expect(options.error('boom')).toEqual({
      title: 'Could not remove',
      description: 'Something went wrong.',
    });
  });
});
