import { renderWithUI, screen, setupTestLifecycle } from '@/test/utilities';

import EmailPreview from './EmailPreview';

describe('EmailPreview', () => {
  const setup = () => renderWithUI(<EmailPreview />);

  setupTestLifecycle();

  test('lists a trigger for every sample email', () => {
    setup();

    expect(
      screen.getByRole('button', { name: /reset password/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /analytics report/i }),
    ).toBeInTheDocument();
  });

  test('keeps the samples collapsed initially', () => {
    setup();

    // The bodies stay mounted as raw email HTML, just hidden until expanded.
    expect(
      screen.getByText(/Here is the analytics overview report/),
    ).not.toBeVisible();
  });

  test('expands a sample to reveal its rendered email', async () => {
    const { user, container } = setup();

    await user.click(screen.getByRole('button', { name: /analytics report/i }));

    expect(container.textContent).toContain(
      'Here is the analytics overview report',
    );
    expect(container.textContent).toContain('01/01/2026 - 31/12/2026');
  });

  test('renders the reset password sample with its action link', async () => {
    const { user, container } = setup();

    await user.click(screen.getByRole('button', { name: /reset password/i }));

    expect(container.innerHTML).toContain(
      'https://sgr-portal.vercel.app/reset-password?token=sample',
    );
  });
});
