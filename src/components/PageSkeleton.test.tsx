import { renderWithUI, screen } from '@/test/utilities';

import ListPageSkeleton, {
  StatsSkeleton,
  TableSkeleton,
  TitleSkeleton,
} from './PageSkeleton';

describe('PageSkeleton', () => {
  test('renders the real page title and hides the action buttons', () => {
    renderWithUI(<TitleSkeleton title="Matches" actions={['Add']} />);

    expect(
      screen.getByRole('heading', { name: /Matches/ }),
    ).toBeInTheDocument();
    // The button only reserves its size inside the skeleton.
    expect(screen.getByText('Add').closest('.chakra-skeleton')).not.toBeNull();
  });

  test('renders one placeholder card per stat', () => {
    const { container } = renderWithUI(<StatsSkeleton count={5} />);

    expect(container.querySelectorAll('.chakra-stat__root')).toHaveLength(5);
  });

  test('renders a header row plus one row per table row', () => {
    renderWithUI(<TableSkeleton columns={3} rows={4} />);

    const rows = screen.getAllByRole('row');
    expect(rows).toHaveLength(5);
    expect(rows[0].children).toHaveLength(3);
  });

  test('omits the stats when the list page has none', () => {
    const { container } = renderWithUI(<ListPageSkeleton title="Teams" />);

    expect(container.querySelector('.chakra-stat__root')).toBeNull();
    expect(screen.getAllByRole('row')).toHaveLength(6);
  });
});
