import { renderWithUI, screen } from '@/test/utilities';

import Loading from './loading';

describe('Loading', () => {
  test('renders the page title', async () => {
    renderWithUI(await Loading());

    expect(
      screen.getByRole('heading', { name: new RegExp('^Matches') }),
    ).toBeInTheDocument();
  });
});
