import { renderWithUI, screen } from '@/test/utilities';

import Loading from './loading';

describe('Loading', () => {
  test('renders the page title and copy action', () => {
    renderWithUI(<Loading />);

    expect(
      screen.getByRole('heading', { name: new RegExp('^Team Rule') }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /copy/i })).toBeInTheDocument();
  });
});
