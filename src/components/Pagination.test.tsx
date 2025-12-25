import { axe } from 'jest-axe';

import { renderWithUI, screen } from '@/test/utilities';
import Pagination from './Pagination';

describe('Pagination', () => {
  const onPageChange = vi.fn();

  const defaultProps = {
    count: 26,
    page: 1,
    pageSize: 5,
    onPageChange,
  };

  const setup = (overrides = {}) => {
    const props = { ...defaultProps, ...overrides };
    const view = renderWithUI(<Pagination {...props} />);

    return view;
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should be accessible', async () => {
    const { container } = setup();

    const result = await axe(container);
    expect(result).toHaveNoViolations();
  });

  test('hides pagination when count is 0', () => {
    const { container } = setup({ count: 0 });

    const pagination = container.querySelector('[data-scope="pagination"]');
    expect(pagination).toHaveStyle('display: none');
  });

  test('shows pagination when count is greater than 0', () => {
    const { container } = setup({ count: 1 });

    const pagination = container.querySelector('[data-scope="pagination"]');
    expect(pagination).toHaveStyle('display: flex');
  });

  test('renders pagination with correct information', () => {
    setup();

    const pageText =
      screen.getByLabelText('pagination').children[0].textContent;
    const prevButton = screen.getByRole('button', { name: /previous/i });
    const nextButton = screen.getByRole('button', { name: /next/i });

    expect(pageText).toBe('1 - 5 of 26');
    expect(prevButton).toBeInTheDocument();
    expect(nextButton).toBeInTheDocument();
  });

  test('calls onPageChange when next button is clicked', async () => {
    const { user } = setup();

    const nextButton = screen.getByRole('button', { name: /next/i });
    await user.click(nextButton);

    expect(onPageChange).toHaveBeenCalledWith(
      expect.objectContaining({ page: 2 }),
    );
  });

  test('calls onPageChange when previous button is clicked on page 2', async () => {
    const onPageChange = vi.fn();
    const { user } = setup({ page: 2, onPageChange });

    const prevButton = screen.getByRole('button', { name: /previous/i });
    await user.click(prevButton);

    expect(onPageChange).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1 }),
    );
  });
});
