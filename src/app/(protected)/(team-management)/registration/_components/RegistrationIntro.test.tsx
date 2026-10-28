import { renderWithUI, screen } from '@/test/utilities';

import RegistrationIntro from './RegistrationIntro';

describe('RegistrationIntro', () => {
  test('renders the title and subtitle', () => {
    renderWithUI(<RegistrationIntro />);

    expect(
      screen.getByRole('heading', { name: new RegExp('^Registration') }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/register players for a league/i),
    ).toBeInTheDocument();
  });
});
