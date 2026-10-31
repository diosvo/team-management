import { renderWithUI, screen } from '@/test/utilities';

import { DEFAULT_LOGIN_REDIRECT } from '@/routes';

import Forbidden from './forbidden';

describe('Forbidden', () => {
  test('renders the access denied message with a link back home', () => {
    renderWithUI(<Forbidden />);

    expect(screen.getByText('Access Denied')).toBeInTheDocument();
    expect(
      screen.getByText('You are not authorized to access this resource.'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /return dashboard/i }),
    ).toHaveAttribute('href', DEFAULT_LOGIN_REDIRECT);
  });
});
