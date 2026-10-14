import { MOCK_REPORT_SCHEDULE } from '@/test/mocks/report';
import { MOCK_USER } from '@/test/mocks/user';
import {
  createPermissionsMock,
  createToasterMock,
  expectNoA11yViolations,
  mockToaster,
  renderWithUI,
  screen,
  setupTestLifecycle,
  waitFor,
  within,
} from '@/test/utilities';

import usePermissions from '@/hooks/use-permissions';
import { SCHEDULED_INTERVAL_LABEL } from '@/utils/constants';
import { Interval } from '@/utils/enum';
import { formatDatetime } from '@/utils/formatter';
import type { Action } from '@/utils/permissions';

import {
  removeReportSchedules,
  runReportNow,
  toggleReportSchedule,
} from '@/actions/report';
import type { ReportSchedule } from '@/drizzle/schema';

import ReportSchedules from './ReportSchedules';
import { UpsertReportSchedule } from './UpsertReportSchedule';

vi.mock('@/hooks/use-permissions', () => ({
  default: vi.fn(),
}));

vi.mock('@/actions/report', () => ({
  removeReportSchedules: vi.fn(),
  runReportNow: vi.fn(),
  toggleReportSchedule: vi.fn(),
}));

vi.mock('@/components/ui/toaster', () => createToasterMock());

vi.mock('./UpsertReportSchedule', () => ({
  UPSERT_SCHEDULE_ID: 'upsert-schedule',
  UpsertReportSchedule: { open: vi.fn(), Viewport: () => null },
}));

describe('ReportSchedules', () => {
  const mockUsePermissions = vi.mocked(usePermissions);
  const mockToggle = vi.mocked(toggleReportSchedule);
  const mockRunNow = vi.mocked(runReportNow);
  const mockRemove = vi.mocked(removeReportSchedules);
  const mockOpen = vi.mocked(UpsertReportSchedule.open);

  const buildSchedule = (
    overrides: Partial<ReportSchedule> = {},
  ): ReportSchedule => ({ ...MOCK_REPORT_SCHEDULE, ...overrides });

  const monthly = MOCK_REPORT_SCHEDULE;
  const yearly = buildSchedule({
    schedule_id: 'schedule-456',
    interval: Interval.LAST_YEAR,
    recipients: [MOCK_USER.email],
    next_run_at: new Date('2027-01-01T01:00:00Z'),
    last_run_at: new Date('2026-01-01T01:00:00Z'),
  });

  const MONTHLY_LABEL = SCHEDULED_INTERVAL_LABEL.get(Interval.LAST_MONTH)!;
  const YEARLY_LABEL = SCHEDULED_INTERVAL_LABEL.get(Interval.LAST_YEAR)!;

  const rowOf = (label: string) =>
    screen.getByText(label).closest('tr') as HTMLElement;

  const setup = ({
    schedules = [monthly],
    actions = [],
  }: Partial<{
    schedules: Array<ReportSchedule>;
    /** Report actions the user may perform. */
    actions: Array<Action>;
  }> = {}) => {
    mockUsePermissions.mockReturnValue(
      createPermissionsMock({
        can: (resource, action) =>
          resource === 'reports' && actions.includes(action),
        canAny: (perms) =>
          perms.some((perm) => actions.some((a) => perm === `reports:${a}`)),
      }),
    );

    return renderWithUI(<ReportSchedules schedules={schedules} />);
  };

  const FULL_ACCESS: Array<Action> = ['view', 'create', 'edit', 'delete'];

  setupTestLifecycle();

  test('should be accessible', async () => {
    const { container } = setup({ actions: FULL_ACCESS });

    await expectNoA11yViolations(container);
  });

  test('renders the title and the column headers', () => {
    setup();

    expect(screen.getByText('Report Schedules')).toBeInTheDocument();
    ['Report', 'Recipients', 'Next Run', 'Last Run', 'Status'].forEach(
      (header) => {
        expect(screen.getByText(header)).toBeInTheDocument();
      },
    );
  });

  test('renders a row for each schedule', () => {
    setup({ schedules: [monthly, yearly] });

    const monthlyRow = rowOf(MONTHLY_LABEL);
    expect(within(monthlyRow).getByText('2 recipient(s)')).toBeInTheDocument();
    expect(
      within(monthlyRow).getByText(formatDatetime(monthly.next_run_at)),
    ).toBeInTheDocument();

    const yearlyRow = rowOf(YEARLY_LABEL);
    expect(within(yearlyRow).getByText('1 recipient(s)')).toBeInTheDocument();
    expect(
      within(yearlyRow).getByText(formatDatetime(yearly.last_run_at)),
    ).toBeInTheDocument();
  });

  test('hides the next run of a paused schedule', () => {
    setup({ schedules: [buildSchedule({ enabled: false })] });

    const row = rowOf(MONTHLY_LABEL);

    expect(
      within(row).queryByText(formatDatetime(monthly.next_run_at)),
    ).not.toBeInTheDocument();
    // Next Run and Last Run both fall back to a dash.
    expect(within(row).getAllByText('-')).toHaveLength(2);
  });

  test('shows the empty state when there are no schedules', () => {
    setup({ schedules: [] });

    expect(screen.getByText('No report schedules yet')).toBeInTheDocument();
  });

  describe('new schedule', () => {
    test('is hidden without the create permission', () => {
      setup({ actions: ['view'] });

      expect(
        screen.queryByRole('button', { name: /new schedule/i }),
      ).not.toBeInTheDocument();
    });

    test('opens the dialog in add mode with the used intervals', async () => {
      const { user } = setup({ actions: ['create'] });

      await user.click(screen.getByRole('button', { name: /new schedule/i }));

      expect(mockOpen).toHaveBeenCalledWith('upsert-schedule', {
        action: 'Add',
        item: { schedule_id: '' },
        usedIntervals: [Interval.LAST_MONTH],
      });
    });

    test('is disabled once every report is scheduled', () => {
      setup({ schedules: [monthly, yearly], actions: ['create'] });

      const button = screen.getByRole('button', { name: /new schedule/i });

      expect(button).toBeDisabled();
      expect(button).toHaveAttribute(
        'title',
        'Every report is already scheduled',
      );
    });
  });

  describe('row click', () => {
    test('opens the dialog in update mode', async () => {
      const { user } = setup({ actions: ['edit'] });

      await user.click(screen.getByText(MONTHLY_LABEL));

      expect(mockOpen).toHaveBeenCalledWith('upsert-schedule', {
        action: 'Update',
        item: monthly,
        usedIntervals: [Interval.LAST_MONTH],
      });
    });

    test('does nothing without the edit permission', async () => {
      const { user } = setup({ actions: ['view'] });

      await user.click(screen.getByText(MONTHLY_LABEL));

      expect(mockOpen).not.toHaveBeenCalled();
    });
  });

  describe('status toggle', () => {
    test('is disabled without the edit permission', () => {
      setup({ actions: ['view'] });

      expect(
        screen.getByRole('checkbox', { name: 'Enable schedule' }),
      ).toBeDisabled();
    });

    test('pauses a schedule without opening the dialog', async () => {
      mockToggle.mockResolvedValue({ success: true, message: 'Paused' });

      const { user } = setup({ actions: ['edit'] });

      await user.click(
        screen.getByRole('checkbox', { name: 'Enable schedule' }),
      );

      await waitFor(() => {
        expect(mockToggle).toHaveBeenCalledWith(monthly.schedule_id, false);
      });
      expect(mockToaster.create).toHaveBeenCalledWith({
        type: 'success',
        title: 'Paused',
      });
      expect(mockOpen).not.toHaveBeenCalled();
    });

    test('reports a failed toggle', async () => {
      mockToggle.mockResolvedValue({ success: false, message: 'nope' });

      const { user } = setup({ actions: ['edit'] });

      await user.click(
        screen.getByRole('checkbox', { name: 'Enable schedule' }),
      );

      await waitFor(() => {
        expect(mockToaster.create).toHaveBeenCalledWith({
          type: 'error',
          title: 'nope',
        });
      });
    });
  });

  describe('run now', () => {
    test('is hidden without the create or edit permission', () => {
      setup({ actions: ['view'] });

      expect(
        screen.queryByRole('button', { name: /run now/i }),
      ).not.toBeInTheDocument();
    });

    test('is disabled for a paused schedule', () => {
      setup({
        schedules: [buildSchedule({ enabled: false })],
        actions: ['edit'],
      });

      expect(screen.getByRole('button', { name: /run now/i })).toBeDisabled();
    });

    test('generates the report without opening the dialog', async () => {
      mockRunNow.mockResolvedValue({ success: true, message: 'Generated' });

      const { user } = setup({ actions: ['edit'] });

      await user.click(screen.getByRole('button', { name: /run now/i }));

      await waitFor(() => {
        expect(mockRunNow).toHaveBeenCalledWith(monthly.schedule_id);
      });
      expect(mockToaster.create).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'loading' }),
      );
      await waitFor(() => {
        expect(mockToaster.update).toHaveBeenCalledWith('toast-id', {
          type: 'success',
          title: 'Generated',
        });
      });
      expect(mockOpen).not.toHaveBeenCalled();
    });

    test('reports a failed run', async () => {
      mockRunNow.mockResolvedValue({ success: false, message: 'Failed' });

      const { user } = setup({ actions: ['create'] });

      await user.click(screen.getByRole('button', { name: /run now/i }));

      await waitFor(() => {
        expect(mockToaster.update).toHaveBeenCalledWith('toast-id', {
          type: 'error',
          title: 'Failed',
        });
      });
    });
  });

  describe('selection', () => {
    test('is unavailable without the delete permission', () => {
      setup({ actions: ['edit'] });

      expect(
        screen.queryByRole('checkbox', { name: 'Select all rows' }),
      ).not.toBeInTheDocument();
    });

    test('deletes the selected schedules', async () => {
      mockRemove.mockResolvedValue({ success: true, message: 'Deleted' });

      const { user } = setup({
        schedules: [monthly, yearly],
        actions: ['delete'],
      });

      await user.click(
        screen.getByRole('checkbox', { name: 'Select all rows' }),
      );
      await user.click(screen.getByRole('button', { name: /delete/i }));

      await waitFor(() => {
        expect(mockRemove).toHaveBeenCalledWith([
          monthly.schedule_id,
          yearly.schedule_id,
        ]);
      });
      expect(mockToaster.update).toHaveBeenCalledWith('toast-id', {
        type: 'success',
        title: 'Deleted',
      });
    });

    test('reports a failed deletion', async () => {
      mockRemove.mockResolvedValue({ success: false, message: 'nope' });

      const { user } = setup({ actions: ['delete'] });

      await user.click(
        screen.getByRole('checkbox', { name: 'Select all rows' }),
      );
      await user.click(screen.getByRole('button', { name: /delete/i }));

      await waitFor(() => {
        expect(mockToaster.update).toHaveBeenCalledWith('toast-id', {
          type: 'error',
          title: 'nope',
        });
      });
    });
  });
});
