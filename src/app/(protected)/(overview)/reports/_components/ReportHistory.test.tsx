import { MOCK_REPORT_HISTORY } from '@/test/mocks/report';
import {
  expectNoA11yViolations,
  renderWithUI,
  screen,
  setupTestLifecycle,
  within,
} from '@/test/utilities';

import { reportDownloadUrl } from '@/utils/constants';
import { EmailStatus, ReportStatus } from '@/utils/enum';

import type { ReportHistory as ReportHistoryRow } from '@/drizzle/schema';

import ReportHistory from './ReportHistory';

describe('ReportHistory', () => {
  const buildReport = (
    overrides: Partial<ReportHistoryRow> = {},
  ): ReportHistoryRow => ({ ...MOCK_REPORT_HISTORY, ...overrides });

  const rowOf = (period: string) =>
    screen.getByText(period).closest('tr') as HTMLElement;

  const setup = (history: Array<ReportHistoryRow> = [buildReport()]) =>
    renderWithUI(<ReportHistory history={history} />);

  setupTestLifecycle();

  test('should be accessible', async () => {
    const { container } = setup();

    await expectNoA11yViolations(container);
  });

  test('renders the title and the column headers', () => {
    setup();

    expect(screen.getByText('Report History')).toBeInTheDocument();
    [
      'Period',
      'Time Duration',
      'Status',
      'Delivery',
      'Trigger',
      'Generated At',
    ].forEach((header) => {
      expect(screen.getByText(header)).toBeInTheDocument();
    });
  });

  test('renders the period, interval label and trigger of a run', () => {
    setup();

    const row = rowOf(MOCK_REPORT_HISTORY.period);

    expect(within(row).getByText('Last month')).toBeInTheDocument();
    expect(within(row).getByText('Scheduled')).toBeInTheDocument();
    expect(within(row).getByText('Success')).toBeInTheDocument();
  });

  test('shows the empty state when no report was generated', () => {
    setup([]);

    expect(screen.getByText('No reports generated yet')).toBeInTheDocument();
  });

  describe('status', () => {
    test('counts the attempts of a retried run', () => {
      setup([buildReport({ attempts: 3 })]);

      expect(screen.getByText('Success (3 attempts)')).toBeInTheDocument();
    });

    test('surfaces the error of a failed run on hover', () => {
      setup([
        buildReport({ status: ReportStatus.FAILED, error: 'resend down' }),
      ]);

      expect(screen.getByText('Failed')).toHaveAttribute(
        'title',
        'resend down',
      );
    });
  });

  describe('delivery', () => {
    test('renders the delivery status from the webhook', () => {
      setup([buildReport({ delivery_status: EmailStatus.DELIVERED })]);

      expect(screen.getByText('Delivered')).toBeInTheDocument();
    });

    test('renders a dash before any delivery update', () => {
      setup();

      const row = rowOf(MOCK_REPORT_HISTORY.period);

      expect(within(row).getByText('-')).toBeInTheDocument();
    });
  });

  describe('download', () => {
    test('links a successful run to its stored PDF', () => {
      setup();

      expect(screen.getByRole('link', { name: /download/i })).toHaveAttribute(
        'href',
        reportDownloadUrl(MOCK_REPORT_HISTORY.report_id),
      );
    });

    test.each([
      ['failed', { status: ReportStatus.FAILED }],
      ['expired', { status: ReportStatus.EXPIRED, pathname: null }],
      ['without a stored PDF', { pathname: null }],
    ])('is disabled for a run that is %s', (_, overrides) => {
      setup([buildReport(overrides)]);

      expect(
        screen.queryByRole('link', { name: /download/i }),
      ).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /download/i })).toBeDisabled();
    });
  });

  test('paginates the history ten runs at a time', async () => {
    const history = Array.from({ length: 12 }, (_, index) =>
      buildReport({ report_id: `report-${index}`, period: `Period ${index}` }),
    );

    const { user } = setup(history);

    expect(screen.getByText('Period 9')).toBeInTheDocument();
    expect(screen.queryByText('Period 10')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /next page/i }));

    expect(await screen.findByText('Period 10')).toBeInTheDocument();
    expect(screen.queryByText('Period 0')).not.toBeInTheDocument();
  });
});
