import { expectNoA11yViolations, renderWithUI, screen } from '@/test/utilities';

import NotFound from './not-found';

describe('NotFound', () => {
  const setup = async () => renderWithUI(await NotFound());

  test('should be accessible', async () => {
    const { container } = await setup();

    await expectNoA11yViolations(container);
  });

  test('explains the player does not exist', async () => {
    await setup();

    expect(screen.getByText('Player not found')).toBeInTheDocument();
    expect(
      screen.getByText(
        'The player you are looking for does not exist or has been removed.',
      ),
    ).toBeInTheDocument();
  });
});
