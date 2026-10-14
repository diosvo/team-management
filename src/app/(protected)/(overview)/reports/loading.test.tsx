import { renderWithUI } from '@/test/utilities';

import Loading from './loading';

describe('Loading', () => {
  test('renders the schedules and history skeletons', () => {
    const { container } = renderWithUI(<Loading />);

    expect(
      container.querySelectorAll('.chakra-skeleton').length,
    ).toBeGreaterThan(0);
  });
});
