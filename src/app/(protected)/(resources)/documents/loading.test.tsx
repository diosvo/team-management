import { renderWithUI } from '@/test/utilities';

import Loading from './loading';

describe('Loading', () => {
  test('renders a skeleton for the stats and the card grid', () => {
    const { container } = renderWithUI(<Loading />);

    // Title, 4 stats, filters bar and 4 cards.
    expect(
      container.querySelectorAll('.chakra-skeleton').length,
    ).toBeGreaterThanOrEqual(10);
  });
});
