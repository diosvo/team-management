import { useState } from 'react';
import { head } from 'es-toolkit';
import { axe } from 'jest-axe';

import { submitFeedback } from '@/actions/feedback';
import {
  createToasterMock,
  renderWithUI,
  screen,
  waitFor,
} from '@/test/utilities';

import FeedbackDialog from './FeedbackDialog';

const { mockUsePathname } = vi.hoisted(() => ({
  mockUsePathname: vi.fn(() => '/attendance'),
}));

vi.mock('next/navigation', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next/navigation')>();
  return { ...actual, usePathname: mockUsePathname };
});

vi.mock('@/actions/feedback', () => ({ submitFeedback: vi.fn() }));

vi.mock('@/components/ui/toaster', () => createToasterMock());

import { toaster } from '@/components/ui/toaster';

/** Owns the open state, as `AccountMenu` does. */
function Harness() {
  const [open, setOpen] = useState(true);
  return <FeedbackDialog open={open} onOpenChange={setOpen} />;
}

const PAGE = '/attendance';
const REPORT = {
  title: 'Attendance export is empty',
  description: 'It is empty',
};
const SENT = {
  success: true,
  message: 'Thanks! Your feedback was filed as #42.',
};
const FAILED = {
  success: false,
  message: 'Unable to send your feedback right now.',
};

describe('FeedbackDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePathname.mockReturnValue(PAGE);
    vi.mocked(submitFeedback).mockResolvedValue(SENT);
  });

  const open = async () => {
    const utils = renderWithUI(<Harness />);

    await screen.findByRole('dialog');

    return utils;
  };

  const fill = async (
    user: Awaited<ReturnType<typeof open>>['user'],
    { title, description } = REPORT,
  ) => {
    await user.type(screen.getByLabelText(/title/i), title);
    await user.type(screen.getByLabelText(/description/i), description);
  };

  const send = (user: Awaited<ReturnType<typeof open>>['user']) =>
    user.click(screen.getByRole('button', { name: /^send/i }));

  test('should be accessible', async () => {
    const { baseElement } = await open();
    const result = await axe(baseElement);
    expect(result).toHaveNoViolations();
  });

  test('defaults to a bug report and offers the current page', async () => {
    await open();

    expect(screen.getByRole('radio', { name: 'Bug' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Feature' })).not.toBeChecked();
    expect(screen.getByRole('radio', { name: 'Other' })).not.toBeChecked();
    expect(
      screen.getByRole('checkbox', { name: /include the page i am on/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/\/attendance/)).toBeInTheDocument();
  });

  test('keeps the button disabled until the form is valid', async () => {
    const { user } = await open();

    const button = screen.getByRole('button', { name: /^send/i });
    expect(button).toBeDisabled();

    await fill(user);

    await waitFor(() => expect(button).toBeEnabled());
  });

  test('sends the report, confirms, and closes', async () => {
    const { user } = await open();

    await fill(user);
    await send(user);

    await waitFor(() =>
      expect(submitFeedback).toHaveBeenCalledWith({
        type: 'bug',
        ...REPORT,
        page: PAGE,
      }),
    );
    await waitFor(() =>
      expect(toaster.update).toHaveBeenCalledWith(expect.anything(), {
        type: 'success',
        title: SENT.message,
      }),
    );
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
  });

  test('sends the type the reporter picked', async () => {
    const { user } = await open();

    await fill(user);
    await user.click(screen.getByRole('radio', { name: 'Feature' }));
    await send(user);

    await waitFor(() =>
      expect(submitFeedback).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'feature' }),
      ),
    );
  });

  test('leaves the page out when the toggle is off', async () => {
    const { user } = await open();

    await fill(user);
    await user.click(
      screen.getByRole('checkbox', { name: /include the page i am on/i }),
    );
    await send(user);

    await waitFor(() => expect(submitFeedback).toHaveBeenCalledTimes(1));
    expect(
      head(head(vi.mocked(submitFeedback).mock.calls)!)!.page,
    ).toBeUndefined();
  });

  test('keeps the dialog open when sending fails', async () => {
    vi.mocked(submitFeedback).mockResolvedValue(FAILED);
    const { user } = await open();

    await fill(user);
    await send(user);

    await waitFor(() =>
      expect(toaster.update).toHaveBeenCalledWith(expect.anything(), {
        type: 'error',
        title: FAILED.message,
      }),
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  test('closes the dialog when the close button is clicked', async () => {
    const { user } = await open();

    await user.click(screen.getByRole('button', { name: /close/i }));

    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
  });
});
