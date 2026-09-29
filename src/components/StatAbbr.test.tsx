import {
  expectNoA11yViolations,
  renderWithUI,
  screen,
  setupTestLifecycle,
  waitFor,
} from '@/test/utilities';

import StatAbbr from './StatAbbr';

describe('StatAbbr', () => {
  setupTestLifecycle();

  const setup = () =>
    renderWithUI(<StatAbbr short="PF" label="Personal fouls" />);

  test('shows the abbreviation and names it for screen readers', () => {
    setup();
    expect(screen.getByText('PF')).toHaveAttribute(
      'aria-label',
      'Personal fouls',
    );
  });

  test('spells out the full name on hover', async () => {
    const { user } = setup();
    await user.hover(screen.getByText('PF'));
    await waitFor(() =>
      expect(screen.getByRole('tooltip')).toHaveTextContent('Personal fouls'),
    );
  });

  test('can be reached with the keyboard', async () => {
    const { user } = setup();
    await user.tab();
    expect(screen.getByText('PF')).toHaveFocus();
  });

  test('should be accessible', async () => {
    const { container } = setup();
    await expectNoA11yViolations(container);
  });
});
