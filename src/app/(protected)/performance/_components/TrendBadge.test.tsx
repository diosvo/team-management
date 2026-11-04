import { renderWithUI, screen } from '@/test/utilities';

import TrendBadge from './TrendBadge';

describe('TrendBadge', () => {
  test.each([
    [12, '+12%'],
    [-5, '-5%'],
    [0, '0%'],
  ])('shows %d as %s', (value, text) => {
    renderWithUI(<TrendBadge value={value} />);

    expect(screen.getByText(text)).toBeInTheDocument();
  });
});
