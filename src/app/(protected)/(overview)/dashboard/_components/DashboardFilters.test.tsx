import { triggerDownload } from '@/lib/download';
import {
  createToasterMock,
  expectNoA11yViolations,
  mockToaster,
  mockUseQueryStates,
  renderWithUI,
  screen,
  waitFor,
} from '@/test/utilities';
import type { DateRange } from '@/types/common';
import { formatDateRange, thisYear } from '@/utils/datetime';

import DashboardFilters from './DashboardFilters';

const LAST_YEAR: DateRange = { from: '2025-01-01', to: '2025-12-31' };

// Mirror the payload the component derives from the selected window so the
// expectations stay correct regardless of the year the suite runs in.
const expectedPayload = (range: DateRange) => {
  const period = formatDateRange(range);
  const filename = `sgr-report-${period.replace(/\D+/g, '-')}.pdf`;
  return { ...range, filename };
};

vi.mock('@/lib/download', () => ({
  triggerDownload: vi.fn(),
}));

vi.mock('@/components/ui/toaster', () => createToasterMock());

describe('DashboardFilters', () => {
  const mockSetSearchParams = vi.fn();
  const mockFetch = vi.fn();

  const setup = (overrides = {}) => {
    mockUseQueryStates({ ...thisYear(), ...overrides }, mockSetSearchParams);

    return renderWithUI(<DashboardFilters />);
  };

  // Download lives behind the Actions menu — open it, then click the item.
  const clickDownload = async (user: ReturnType<typeof setup>['user']) => {
    await user.click(screen.getByRole('button', { name: /Actions/i }));
    await user.click(
      await screen.findByRole('menuitem', { name: /Download/i }),
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test('should be accessible', async () => {
    const { container } = setup();

    await expectNoA11yViolations(container);
  });

  test('renders the actions menu and the selected window', () => {
    setup();

    expect(
      screen.getByRole('button', { name: /Actions/i }),
    ).toBeInTheDocument();
    // A window that matches a preset is announced by the preset's name.
    expect(
      screen.getByRole('button', { name: 'Time: This year' }),
    ).toBeInTheDocument();
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

      const { from, to, filename } = expectedPayload(thisYear());

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/reports/dashboard', {
          method: 'POST',
          body: JSON.stringify({ from, to, filename }),
        });
      });

      expect(triggerDownload).toHaveBeenCalledWith(blob, filename);
      expect(mockToaster.error).not.toHaveBeenCalled();
    });

    test('sends the currently selected window in the request body', async () => {
      const blob = new Blob(['pdf'], { type: 'application/pdf' });
      mockFetch.mockResolvedValue({
        ok: true,
        blob: vi.fn().mockResolvedValue(blob),
      });

      const { user } = setup(LAST_YEAR);
      await clickDownload(user);

      const { from, to, filename } = expectedPayload(LAST_YEAR);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/reports/dashboard',
          expect.objectContaining({
            body: JSON.stringify({ from, to, filename }),
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
        expect(mockToaster.error).toHaveBeenCalledWith({
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

  describe('DateRangePicker', () => {
    test('writes the picked window to the URL and resets the page', async () => {
      const { user } = setup();

      await user.click(screen.getByRole('button', { name: 'Time: This year' }));
      await user.click(
        await screen.findByRole('button', { name: 'Last year' }),
      );

      const { from, to } = LAST_YEAR;
      await waitFor(() =>
        expect(mockSetSearchParams).toHaveBeenCalledWith(
          { from, to, page: 1 },
          { shallow: false },
        ),
      );
    });
  });
});
