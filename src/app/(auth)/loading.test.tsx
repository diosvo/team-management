import { render, screen } from '@/test/utilities';

import LoadingPage from './loading';

vi.mock('@/components/Loading', () => ({
  default: () => <div data-testid="loading-component">Loading...</div>,
}));

describe('LoadingPage', () => {
  test('renders the Loading component', () => {
    render(<LoadingPage />);

    expect(screen.getByTestId('loading-component')).toBeInTheDocument();
  });
});
