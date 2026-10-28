import { renderWithUI, screen } from '@/test/utilities';

import NotFound from './not-found';

describe('NotFound', () => {
  test('renders the user not found message', () => {
    renderWithUI(<NotFound />);

    expect(screen.getByText('User not found')).toBeInTheDocument();
    expect(
      screen.getByText(
        'The profile you are looking for does not exist or has been removed.',
      ),
    ).toBeInTheDocument();
  });
});
