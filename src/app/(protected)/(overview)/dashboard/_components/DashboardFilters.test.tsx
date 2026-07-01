import * as nuqs from 'nuqs';
import { Mock } from 'vitest';

import { toaster } from '@/components/ui/toaster';

import { triggerDownload } from '@/lib/download';
import { renderWithUI, screen, waitFor } from '@/test/utilities';
import { Interval } from '@/utils/enum';
import { formatDuration } from '@/utils/formatter';

import DashboardFilters from './DashboardFilters';

// Mirror the payload the component derives from the selected interval so the
// expectations stay correct regardless of the year the suite runs in.
const expectedPayload = (interval: Interval) => {
  const period = formatDuration(interval);
  const filename = `sgr-report-${period.replace(/\D+/g, '-')}.pdf`;
  return { period, filename };
};

vi.mock('@/lib/download', () => ({
  triggerDownload: vi.fn(),
}));

vi.mock('@/components/ui/toaster', () => ({
  toaster: {
    error: vi.fn(),
  },
}));

describe('DashboardFilters', () => {
  const mockSetSearchParams = vi.fn();
  const mockFetch = vi.fn();

  const setup = (overrides = {}) => {
    const mockQueryState = { interval: Interval.THIS_YEAR, ...overrides };
    (nuqs.useQueryStates as unknown as Mock).mockReturnValue([
      mockQueryState,
      mockSetSearchParams,
    ]);

    return renderWithUI(<DashboardFilters />);
  };

  // Download lives behind the Actions menu — open it, then click the item.
  const clickDownload = async (user: ReturnType<typeof setup>['user']) => {
    await user.click(screen.getByRole('button', { name: /Actions/i }));
    await user.click(await screen.findByRole('menuitem', { name: /Download/i }));
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test('renders the actions menu and the selected interval', () => {
    setup();

    expect(
      screen.getByRole('button', { name: /Actions/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getAllByText('This year').length).toBeGreaterThan(0);
  });

  describe('handleDownload', () => {
    test('downloads the generated report on a successful response', async () => {
      const blob = new Blob(['pdf'], { type: 'application/pdf' });
      mockFetch.mockResolvedValue({
        ok: true,
        blob: vi.fn().mockResolvedValue(blob),
      });

      const { user } = setup();
      await clickDownload(user);

      const { period, filename } = expectedPayload(Interval.THIS_YEAR);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/reports/dashboard', {
          method: 'POST',
          body: JSON.stringify({ period, filename }),
        });
      });

      expect(triggerDownload).toHaveBeenCalledWith(blob, filename);
      expect(toaster.error).not.toHaveBeenCalled();
    });

    test('sends the currently selected interval in the request body', async () => {
      const blob = new Blob(['pdf'], { type: 'application/pdf' });
      mockFetch.mockResolvedValue({
        ok: true,
        blob: vi.fn().mockResolvedValue(blob),
      });

      const { user } = setup({ interval: Interval.LAST_YEAR });
      await clickDownload(user);

      const { period, filename } = expectedPayload(Interval.LAST_YEAR);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/reports/dashboard',
          expect.objectContaining({
            body: JSON.stringify({ period, filename }),
          }),
        );
      });
    });

    test('shows an error toast and does not download when the response fails', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: vi.fn().mockResolvedValue({ error: 'Something went wrong' }),
      });

      const { user } = setup();
      await clickDownload(user);

      await waitFor(() => {
        expect(toaster.error).toHaveBeenCalledWith({
          title: 'Download failed',
          description: 'Something went wrong',
        });
      });

      expect(triggerDownload).not.toHaveBeenCalled();
    });

    test('shows a loading state while generating, then restores it', async () => {
      const blob = new Blob(['pdf'], { type: 'application/pdf' });
      let resolveFetch: (value: unknown) => void;
      mockFetch.mockReturnValue(
        new Promise((resolve) => {
          resolveFetch = resolve;
        }),
      );

      const { user } = setup();
      await clickDownload(user);

      expect(await screen.findByText('Generating...')).toBeInTheDocument();

      resolveFetch!({ ok: true, blob: vi.fn().mockResolvedValue(blob) });

      await waitFor(() => {
        expect(triggerDownload).toHaveBeenCalled();
      });
      expect(screen.queryByText('Generating...')).not.toBeInTheDocument();
    });
  });

  describe('TimePicker', () => {
    test('updates the interval search param and resets the page on change', async () => {
      const { user } = setup();

      await user.click(screen.getByRole('combobox'));
      const options = await screen.findAllByText('Last year');
      const item =
        options.find((el) => el.closest('[data-part="item"]')) ?? options[0];
      await user.click(item);

      expect(mockSetSearchParams).toHaveBeenCalledWith(
        { interval: Interval.LAST_YEAR, page: 1 },
        { shallow: false },
      );
    });
  });
});
