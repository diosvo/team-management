import { axe } from 'jest-axe';
import * as nuqs from 'nuqs';
import { Mock } from 'vitest';

import { renderWithUI, screen } from '@/test/utilities';
import SearchInput from './SearchInput';

describe('SearchInput', () => {
  const mockSetSearchParams = vi.fn();

  const setup = (overrides = {}) => {
    const mockQueryState = { q: '', ...overrides };
    (nuqs.useQueryStates as unknown as Mock).mockReturnValue([
      mockQueryState,
      mockSetSearchParams,
    ]);

    const view = renderWithUI(<SearchInput />);
    const input = screen.getByPlaceholderText('Search...');

    return {
      ...view,
      input: input as HTMLInputElement,
    };
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  test('should be accessible', async () => {
    const { container } = setup();

    const result = await axe(container);
    expect(result).toHaveNoViolations();
  });

  test('renders search input with correct attributes', () => {
    const { input } = setup();

    expect(input).toBeInTheDocument();
    expect(input).toHaveClass('chakra-input');
    expect(input).toHaveAttribute('type', 'search');
    expect(input).toHaveAttribute('name', 'search-input');
  });

  test('renders search icon', () => {
    const { container } = setup();

    const icon = container.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  test('displays initial query value from URL params', () => {
    const { input } = setup({ q: 'searched' });

    expect(input.value).toBe('searched');
  });

  test('updates local state when typing', async () => {
    const { user, input } = setup();

    await user.type(input, 'test');

    expect(input.value).toBe('test');
  });

  test('hides close button when search is empty', () => {
    setup();

    const closeButton = screen.queryByRole('button');
    expect(closeButton).not.toBeInTheDocument();
  });

  test('shows close button when search has value', async () => {
    const { user, input } = setup();

    await user.type(input, 't');

    const closeButton = await screen.findByRole('button');
    expect(closeButton).toBeInTheDocument();
  });

  test('clears search when close button is clicked', async () => {
    const { user, input } = setup();

    await user.type(input, 't');

    const closeButton = await screen.findByRole('button');
    await user.click(closeButton);

    expect(input.value).toBe('');
    expect(input).toHaveFocus();
  });
});
