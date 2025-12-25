import { axe } from 'jest-axe';
import { act } from 'react';

import { renderWithUI, screen } from '@/test/utilities';
import SelectionActionBar from './SelectionActionBar';

describe('SelectionActionBar', () => {
  const onDelete = vi.fn();

  const defaultProps = {
    open: true,
    selectionCount: 3,
    onDelete,
  };

  const setup = (overrides = {}) => {
    const props = { ...defaultProps, ...overrides };
    const view = renderWithUI(<SelectionActionBar {...props} />);
    const deleteButton = screen.queryByRole('button', { name: /delete/i });

    return {
      ...view,
      deleteButton,
    };
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should be accessible', async () => {
    const { container } = setup();

    const result = await axe(container);
    expect(result).toHaveNoViolations();
  });

  test('renders action bar when open is true', async () => {
    const { deleteButton } = setup();

    expect(screen.getByText('3 selected')).toBeInTheDocument();
    expect(deleteButton).toBeInTheDocument();
  });

  test('does not render action bar when open is false', async () => {
    const { deleteButton } = setup({ open: false });

    expect(screen.queryByText('3 selected')).not.toBeInTheDocument();
    expect(deleteButton).not.toBeInTheDocument();
  });

  test('displays correct selection count', async () => {
    setup({ selectionCount: 1 });

    expect(screen.getByText('1 selected')).toBeInTheDocument();
  });

  test('calls onDelete when delete button is clicked', async () => {
    const { user, deleteButton } = setup();

    await user.click(deleteButton as HTMLElement);

    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  test('updates selection count when prop changes', async () => {
    const { rerender } = setup({ selectionCount: 2 });

    expect(screen.getByText('2 selected')).toBeInTheDocument();

    await act(async () => {
      rerender(
        <SelectionActionBar
          open={true}
          selectionCount={5}
          onDelete={onDelete}
        />,
      );
    });

    expect(screen.getByText('5 selected')).toBeInTheDocument();
  });
});
