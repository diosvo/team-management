import * as nuqs from 'nuqs';
import { Mock } from 'vitest';

import { toaster } from '@/components/ui/toaster';

import { triggerDownload } from '@/lib/download';
import { renderWithUI, screen, waitFor } from '@/test/utilities';
import { Interval } from '@/utils/enum';

import DashboardFilters from './DashboardFilters';

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

    const view = renderWithUI(<DashboardFilters />);
    const downloadButton = screen.getByRole('button', { name: /Download/ });

    return {
      ...view,
      downloadButton,
    };
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test('renders the download button and the selected interval', () => {
    const { downloadButton } = setup();

    expect(downloadButton).toBeInTheDocument();
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

      const { user, downloadButton } = setup();
      await user.click(downloadButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/reports/dashboard', {
          method: 'POST',
          body: JSON.stringify({
            interval: Interval.THIS_YEAR,
            filename: 'analytics-overview-report.pdf',
          }),
        });
      });

      expect(triggerDownload).toHaveBeenCalledWith(
        blob,
        'analytics-overview-report.pdf',
      );
      expect(toaster.error).not.toHaveBeenCalled();
    });

    test('sends the currently selected interval in the request body', async () => {
      const blob = new Blob(['pdf'], { type: 'application/pdf' });
      mockFetch.mockResolvedValue({
        ok: true,
        blob: vi.fn().mockResolvedValue(blob),
      });

      const { user, downloadButton } = setup({ interval: Interval.LAST_YEAR });
      await user.click(downloadButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/reports/dashboard',
          expect.objectContaining({
            body: JSON.stringify({
              interval: Interval.LAST_YEAR,
              filename: 'analytics-overview-report.pdf',
            }),
          }),
        );
      });
    });

    test('shows an error toast and does not download when the response fails', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: vi.fn().mockResolvedValue({ error: 'Something went wrong' }),
      });

      const { user, downloadButton } = setup();
      await user.click(downloadButton);

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

      const { user, downloadButton } = setup();
      await user.click(downloadButton);

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
