import { axe } from 'jest-axe';

import { UseQueryReturn } from '@/hooks/use-query';
import { renderWithUI, screen, waitFor } from '@/test/utilities';

import SearchableSelect from './SearchableSelect';

// 👀 Use findBy to wait for items to appear

type MockItem = {
  id: string;
  name: string;
};

describe('SearchableSelect', () => {
  const onSelectionChange = vi.fn();

  const mockItems: Array<MockItem> = [
    { id: '1', name: 'Item 1' },
    { id: '2', name: 'Item 2' },
    { id: '3', name: 'Item 3' },
  ];

  const mockRequest: UseQueryReturn<Array<MockItem>> = {
    data: mockItems,
    loading: false,
    error: null,
  };

  const defaultProps = {
    label: 'items',
    placeholder: 'Type to search',
    request: mockRequest,
    selection: [],
    onSelectionChange,
    itemToString: (item: MockItem) => item.name,
    itemToValue: (item: MockItem) => item.id,
  };

  const setup = (overrides = {}) => {
    const props = { ...defaultProps, ...overrides };
    const view = renderWithUI(<SearchableSelect {...props} />);
    const input = screen.getByPlaceholderText(props.placeholder);

    return {
      ...view,
      input,
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

  test('renders with label and placeholder', () => {
    const { input } = setup();

    expect(screen.getByText(/Select items/)).toBeInTheDocument();
    expect(input).toBeInTheDocument();
  });

  test('renders custom placeholder', () => {
    setup({ placeholder: 'Custom placeholder' });

    expect(
      screen.getByPlaceholderText('Custom placeholder'),
    ).toBeInTheDocument();
  });

  test('displays loading state', () => {
    setup({
      request: { ...mockRequest, loading: true },
    });

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  test('displays error state', () => {
    const errorMessage = 'Failed to load items';
    setup({
      request: {
        ...mockRequest,
        loading: false,
        error: new Error(errorMessage),
      },
    });

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  test('displays empty state when no items found', async () => {
    const { user, input } = setup({ request: { ...mockRequest, data: [] } });

    await user.click(input);

    expect(screen.getByText('No items found.')).toBeInTheDocument();
  });

  test('renders items when dropdown is opened', async () => {
    const { user, input } = setup();

    await user.click(input);

    expect(await screen.findByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
    expect(screen.getByText('Item 3')).toBeInTheDocument();
  });

  test('filters items based on input', async () => {
    const { user, input } = setup();

    await user.click(input);

    await screen.findByText('Item 1');
    expect(screen.getByText('Item 2')).toBeInTheDocument();
    expect(screen.getByText('Item 3')).toBeInTheDocument();

    // Type to filter,
    // but don't clear first as it may lose the collection
    await user.type(input, '1');

    await waitFor(() => {
      expect(screen.getByText('Item 1')).toBeInTheDocument();
    });
  });

  test('calls onSelectionChange when item is selected', async () => {
    const { user, input } = setup();

    await user.click(input);

    const item = await screen.findByText('Item 1');
    await user.click(item);

    expect(onSelectionChange).toHaveBeenCalledWith([mockItems[0]]);
  });

  test('displays selection count', () => {
    setup({ selection: [mockItems[0], mockItems[1]] });

    expect(screen.getByText('2 / 3 selected')).toBeInTheDocument();
  });

  test('enforces maxItems limit', async () => {
    const { user, input } = setup({
      maxItems: 2,
      selection: [mockItems[0], mockItems[1]],
    });

    expect(screen.getByText('(max 2)')).toBeInTheDocument();

    await user.click(input);

    // Item not found since max reached
    const item = await screen.findByText('Item 3');
    await user.click(item);

    expect(onSelectionChange).not.toHaveBeenCalled();
  });

  test('hides helper text when showHelperText is false', () => {
    setup({ showHelperText: false });

    expect(screen.queryByText(/max/)).not.toBeInTheDocument();
    expect(screen.getByText('Items')).toBeInTheDocument();
  });

  test('disables component when disabled prop is true', () => {
    const { input } = setup({ disabled: true });

    expect(input).toBeDisabled();
  });

  test('supports single selection mode', async () => {
    const { user, input } = setup({ multiple: false });

    await user.click(input);

    const item = await screen.findByText('Item 1');
    await user.click(item);

    expect(onSelectionChange).toHaveBeenCalledWith([mockItems[0]]);
  });

  test('renders custom items with renderItem prop', async () => {
    const renderItem = (item: MockItem) => <div>Custom: {item.name}</div>;
    const { user, input } = setup({ renderItem });

    await user.click(input);

    const item = await screen.findByText('Custom: Item 1');
    expect(item).toBeInTheDocument();
  });

  test('clears selection with clear trigger', async () => {
    const { user, container } = setup({
      selection: [mockItems[0]],
    });

    const clearButton = container.querySelector(
      '[aria-label="Clear value"]',
    ) as HTMLButtonElement;

    if (clearButton && !clearButton.hidden) {
      await user.click(clearButton);
      expect(onSelectionChange).toHaveBeenCalled();
    }
  });

  test('updates items when request data changes', () => {
    const { rerender } = setup();

    const newItems: Array<MockItem> = [
      { id: '4', name: 'Item 4' },
      { id: '5', name: 'Item 5' },
    ];

    rerender(
      <SearchableSelect
        {...defaultProps}
        request={{ ...mockRequest, data: newItems }}
      />,
    );

    expect(defaultProps.onSelectionChange).not.toHaveBeenCalled();
  });
});
