import { renderWithUI } from '@/test/utilities';

import ListPageSkeleton, { StatsSkeleton, TitleSkeleton } from './PageSkeleton';

const skeletons = (container: HTMLElement) =>
  container.querySelectorAll('.chakra-skeleton');

describe('PageSkeleton', () => {
  test('TitleSkeleton renders the action placeholder only when asked', () => {
    const { container, rerender } = renderWithUI(<TitleSkeleton />);
    expect(skeletons(container)).toHaveLength(1);

    rerender(<TitleSkeleton action />);
    expect(skeletons(container)).toHaveLength(2);
  });

  test('StatsSkeleton renders one card per stat', () => {
    const { container } = renderWithUI(<StatsSkeleton count={3} />);

    expect(skeletons(container)).toHaveLength(3);
  });

  test('ListPageSkeleton renders title, filters and table by default', () => {
    const { container } = renderWithUI(<ListPageSkeleton />);

    // title + filters bar + 7 table rows
    expect(skeletons(container)).toHaveLength(9);
  });

  test('ListPageSkeleton adds stats and replaces the table with children', () => {
    const { container, getByTestId } = renderWithUI(
      <ListPageSkeleton action stats={2}>
        <div data-testid="grid" />
      </ListPageSkeleton>,
    );

    expect(getByTestId('grid')).toBeInTheDocument();
    // 2 title + 2 stats + 1 filters, no table rows
    expect(skeletons(container)).toHaveLength(5);
  });
});
