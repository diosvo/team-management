import { renderWithUI } from '@/test/utilities';

import FiltersSkeleton from './FiltersSkeleton';

describe('FiltersSkeleton', () => {
  const setup = (props: React.ComponentProps<typeof FiltersSkeleton> = {}) => {
    const { container } = renderWithUI(<FiltersSkeleton {...props} />);
    // The toolbar's direct children are its slots, as in `Filters`.
    return container.firstElementChild!.children;
  };

  test('renders only the search slot for a search-only toolbar', () => {
    const slots = setup();

    expect(slots).toHaveLength(1);
    expect(slots[0]).toHaveClass('chakra-skeleton');
  });

  test('groups the date window, Filters button and action in one row', () => {
    const [, row] = setup({ date: 'This year', filters: true, action: 'Date' });

    expect(row.textContent).toContain('This year');
    expect(row.textContent).toContain('Filters');
    expect(row.textContent).toContain('Date');
  });
});
