import {
  MOCK_REPORT_RECIPIENTS,
  MOCK_REPORT_SCHEDULE,
} from '@/test/mocks/report';
import {
  act,
  createToasterMock,
  expectNoA11yViolations,
  mockToaster,
  renderWithUI,
  screen,
  setupTestLifecycle,
  waitFor,
  within,
  withFreshSWR,
} from '@/test/utilities';

import { SCHEDULED_INTERVAL_LABEL } from '@/utils/constants';
import { Interval } from '@/utils/enum';

import { getReportRecipients, upsertReportSchedule } from '@/actions/report';

import {
  UPSERT_SCHEDULE_ID,
  UpsertReportSchedule,
} from './UpsertReportSchedule';

const [ME, COACH] = MOCK_REPORT_RECIPIENTS;

vi.mock('@/actions/report', () => ({
  getReportRecipients: vi.fn(),
  upsertReportSchedule: vi.fn(),
}));

vi.mock('@/components/ui/toaster', () => createToasterMock());

// The recipient picker is covered by its own suite; a button selects every
// member so the submitted emails can be asserted.
vi.mock('@/components/SearchableSelect', () => ({
  default: ({
    onChange,
  }: {
    onChange: (items: typeof MOCK_REPORT_RECIPIENTS) => void;
  }) => (
    <button type="button" onClick={() => onChange(MOCK_REPORT_RECIPIENTS)}>
      Select recipients
    </button>
  ),
}));

describe('UpsertReportSchedule', () => {
  const mockGetReportRecipients = vi.mocked(getReportRecipients);
  const mockUpsert = vi.mocked(upsertReportSchedule);

  const MONTHLY_LABEL = SCHEDULED_INTERVAL_LABEL.get(Interval.LAST_MONTH)!;
  const YEARLY_LABEL = SCHEDULED_INTERVAL_LABEL.get(Interval.LAST_YEAR)!;

  const open = async (
    action: 'Add' | 'Update' = 'Add',
    item: Parameters<typeof UpsertReportSchedule.open>[1]['item'] = {
      schedule_id: '',
    },
    usedIntervals: Array<Interval> = [],
  ) => {
    const view = renderWithUI(withFreshSWR(<UpsertReportSchedule.Viewport />));

    await act(async () => {
      UpsertReportSchedule.open(UPSERT_SCHEDULE_ID, {
        action,
        item,
        usedIntervals,
      });
    });

    return view;
  };

  /**
   * Open the report select and return its option labels. The content portals
   * outside the dialog, which marks it aria-hidden, so query it via the
   * trigger's `aria-controls` with hidden elements included.
   */
  const openReportOptions = async (
    user: Awaited<ReturnType<typeof open>>['user'],
  ) => {
    const combobox = await screen.findByRole('combobox');
    await user.click(combobox);

    const content = document.getElementById(
      combobox.getAttribute('aria-controls')!,
    )!;

    return within(content)
      .getAllByRole('option', { hidden: true })
      .map((option) => option.textContent);
  };

  /** Wait for the members to load, then pick all of them. */
  const selectRecipients = async (
    user: Awaited<ReturnType<typeof open>>['user'],
  ) => {
    await user.click(
      await screen.findByRole('button', { name: 'Select recipients' }),
    );
  };

  setupTestLifecycle();

  beforeEach(() => {
    mockGetReportRecipients.mockResolvedValue(MOCK_REPORT_RECIPIENTS);
  });

  afterEach(() => {
    act(() => {
      UpsertReportSchedule.removeAll();
    });
  });

  test('should be accessible', async () => {
    await open();
    await screen.findByRole('button', { name: 'Select recipients' });

    await expectNoA11yViolations();
  });

  test('renders the dialog title for the given action', async () => {
    await open('Update', {
      schedule_id: MOCK_REPORT_SCHEDULE.schedule_id,
      interval: Interval.LAST_MONTH,
      recipients: [],
    });

    expect(
      await screen.findByText('Update Report Schedule'),
    ).toBeInTheDocument();
  });

  test('explains when the report is sent', async () => {
    await open();

    expect(
      await screen.findByText(/emailed once the period has closed/i),
    ).toBeInTheDocument();
  });

  describe('report', () => {
    test('defaults to the first report when adding', async () => {
      await open();

      const combobox = await screen.findByRole('combobox');

      expect(within(combobox).getByText(MONTHLY_LABEL)).toBeInTheDocument();
    });

    test('only offers reports that are not scheduled yet', async () => {
      const { user } = await open('Add', { schedule_id: '' }, [
        Interval.LAST_MONTH,
      ]);

      const combobox = await screen.findByRole('combobox');
      expect(within(combobox).getByText(YEARLY_LABEL)).toBeInTheDocument();

      expect(await openReportOptions(user)).toEqual([YEARLY_LABEL]);
    });

    test('shows no selection when every report is already scheduled', async () => {
      await open('Add', { schedule_id: '' }, [
        Interval.THIS_MONTH,
        Interval.LAST_MONTH,
        Interval.THIS_YEAR,
        Interval.LAST_YEAR,
      ]);

      const combobox = await screen.findByRole('combobox');

      expect(within(combobox).queryByText(MONTHLY_LABEL)).not.toBeInTheDocument();
      expect(within(combobox).queryByText(YEARLY_LABEL)).not.toBeInTheDocument();
    });

    test('keeps its own report available when updating', async () => {
      const { user } = await open(
        'Update',
        {
          schedule_id: MOCK_REPORT_SCHEDULE.schedule_id,
          interval: Interval.LAST_MONTH,
          recipients: [],
        },
        [Interval.LAST_MONTH],
      );

      const combobox = await screen.findByRole('combobox');
      expect(within(combobox).getByText(MONTHLY_LABEL)).toBeInTheDocument();

      expect(await openReportOptions(user)).toEqual([
        MONTHLY_LABEL,
        YEARLY_LABEL,
      ]);
    });
  });

  describe('recipients', () => {
    test('asks for at least one recipient', async () => {
      await open();

      expect(
        await screen.findByText('Add at least one recipient.'),
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /add/i })).toBeDisabled();
    });

    test('explains when there is no team member to pick', async () => {
      mockGetReportRecipients.mockResolvedValue([]);

      await open();

      expect(
        await screen.findByText('No team members available to select.'),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: 'Select recipients' }),
      ).not.toBeInTheDocument();
    });

    test('lists the selected recipients', async () => {
      const { user } = await open();

      await selectRecipients(user);

      const list = await screen.findByRole('list');
      expect(within(list).getByText(`<${ME.email}>`)).toBeInTheDocument();
      expect(within(list).getByText(`<${COACH.email}>`)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /add/i })).toBeEnabled();
    });

    test('shows the saved recipients when updating', async () => {
      await open('Update', {
        schedule_id: MOCK_REPORT_SCHEDULE.schedule_id,
        interval: Interval.LAST_MONTH,
        recipients: [COACH.email],
      });

      const list = await screen.findByRole('list');

      expect(within(list).getByText(`<${COACH.email}>`)).toBeInTheDocument();
      expect(within(list).queryByText(`<${ME.email}>`)).not.toBeInTheDocument();
    });

    test('removes a recipient from the list', async () => {
      const { user } = await open();

      await selectRecipients(user);
      await user.click(
        await screen.findByRole('button', { name: `Remove ${ME.name}` }),
      );

      const list = screen.getByRole('list');
      expect(within(list).queryByText(`<${ME.email}>`)).not.toBeInTheDocument();
      expect(within(list).getByText(`<${COACH.email}>`)).toBeInTheDocument();
    });
  });

  describe('submit', () => {
    test('saves the schedule and closes the dialog', async () => {
      mockUpsert.mockResolvedValue({ success: true, message: 'Saved' });

      const { user } = await open();

      await selectRecipients(user);
      await user.click(screen.getByRole('button', { name: /add/i }));

      await waitFor(() => {
        expect(mockUpsert).toHaveBeenCalledWith('', {
          interval: Interval.LAST_MONTH,
          recipients: [ME.email, COACH.email],
        });
      });
      expect(mockToaster.update).toHaveBeenCalledWith('toast-id', {
        type: 'success',
        title: 'Saved',
      });
      await waitFor(() => {
        expect(
          screen.queryByText('Add Report Schedule'),
        ).not.toBeInTheDocument();
      });
    });

    test('updates the given schedule', async () => {
      mockUpsert.mockResolvedValue({ success: true, message: 'Saved' });

      const { user } = await open('Update', {
        schedule_id: MOCK_REPORT_SCHEDULE.schedule_id,
        interval: Interval.LAST_YEAR,
        recipients: [COACH.email],
      });

      const submit = await screen.findByRole('button', { name: /update/i });
      await waitFor(() => expect(submit).toBeEnabled());
      await user.click(submit);

      await waitFor(() => {
        expect(mockUpsert).toHaveBeenCalledWith(
          MOCK_REPORT_SCHEDULE.schedule_id,
          {
            interval: Interval.LAST_YEAR,
            recipients: [COACH.email],
          },
        );
      });
    });

    test('keeps the dialog open when saving fails', async () => {
      mockUpsert.mockResolvedValue({ success: false, message: 'nope' });

      const { user } = await open();

      await selectRecipients(user);
      await user.click(screen.getByRole('button', { name: /add/i }));

      await waitFor(() => {
        expect(mockToaster.update).toHaveBeenCalledWith('toast-id', {
          type: 'error',
          title: 'nope',
        });
      });
      expect(screen.getByText('Add Report Schedule')).toBeInTheDocument();
    });
  });
});
