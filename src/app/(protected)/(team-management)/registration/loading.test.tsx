import { renderWithUI, screen } from '@/test/utilities';

import RegistrationLoading from './loading';

describe('RegistrationLoading', () => {
  test('renders the registration intro', () => {
    renderWithUI(<RegistrationLoading />);

    expect(
      screen.getByRole('heading', { name: new RegExp('^Registration') }),
    ).toBeInTheDocument();
  });
});
