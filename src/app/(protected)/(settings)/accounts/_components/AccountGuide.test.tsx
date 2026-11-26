import {
  expectNoA11yViolations,
  renderWithUI,
  screen,
  setupTestLifecycle,
} from '@/test/utilities';

import AccountGuide from './AccountGuide';

describe('AccountGuide', () => {
  setupTestLifecycle();

  const open = async () => {
    const result = renderWithUI(<AccountGuide />);
    await result.user.click(
      screen.getByRole('button', { name: 'How signing in works' }),
    );
    return result;
  };

  test('should be accessible', async () => {
    const { container } = renderWithUI(<AccountGuide />);

    await expectNoA11yViolations(container);
  });

  test('opens the guide from the info button', async () => {
    await open();

    expect(
      await screen.findByRole('dialog', { name: 'How signing in works' }),
    ).toBeInTheDocument();
  });

  test('explains invites with the real button labels', async () => {
    await open();

    expect(
      await screen.findByText(/There's no sign-up page/),
    ).toBeInTheDocument();
    // Bolded labels match the buttons on the page
    expect(screen.getByText('Add', { selector: 'b' })).toBeInTheDocument();
    expect(
      screen.getByText('Send password link', { selector: 'b' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Sign out everywhere', { selector: 'b' }),
    ).toBeInTheDocument();
  });

  test('quotes the configured link lifetime', async () => {
    await open();

    expect(
      await screen.findByText(/Links expire after 1 hour\./),
    ).toBeInTheDocument();
  });

  test('covers members without an email and the profile', async () => {
    await open();

    expect(
      await screen.findByText(/No email yet\? Leave it blank/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Change role or state on the profile\./),
    ).toBeInTheDocument();
  });
});
