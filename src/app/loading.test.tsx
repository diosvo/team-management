import { render, screen } from '@/test/utilities';

import RootLoading from './loading';

vi.mock('@/components/Loading', () => ({
  default: () => <div data-testid="loading-component">Loading...</div>,
}));

describe('RootLoading', () => {
  test('renders the Loading component', () => {
    render(<RootLoading />);

    expect(screen.getByTestId('loading-component')).toBeInTheDocument();
  });
});
