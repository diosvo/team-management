import { renderWithUI, screen } from '@/test/utilities';

import {
  ChartSkeleton,
  HeaderSkeleton,
  StatsSkeleton,
} from './PerformanceSkeleton';

describe('PerformanceSkeleton', () => {
  test('renders a chart-sized placeholder', () => {
    const { container } = renderWithUI(<ChartSkeleton />);

    expect(container.querySelector('.chakra-skeleton')).not.toBeNull();
  });

  test('renders the known title for real', () => {
    renderWithUI(<HeaderSkeleton title="Jane Doe" />);

    const heading = screen.getByRole('heading', { name: /Jane Doe/ });
    expect(heading.closest('.chakra-skeleton')).toBeNull();
    expect(
      screen.getByText('Player name').closest('.chakra-skeleton'),
    ).not.toBeNull();
  });

  test('hides the placeholder title until it is known', () => {
    renderWithUI(<HeaderSkeleton />);

    expect(
      screen
        .getByRole('heading', { name: /My Performance/ })
        .closest('.chakra-skeleton'),
    ).not.toBeNull();
  });

  test('renders four stat cards', () => {
    const { container } = renderWithUI(<StatsSkeleton />);

    expect(container.querySelectorAll('.chakra-stat__root')).toHaveLength(4);
  });
});
