import { renderWithUI, screen } from '@/test/utilities';

import Loading from './loading';

vi.mock('../_components/PerformanceLoading', () => ({
  default: () => <div data-testid="performance-skeleton" />,
}));

describe('Loading', () => {
  test('renders the performance skeleton', () => {
    renderWithUI(<Loading />);

    expect(screen.getByTestId('performance-skeleton')).toBeInTheDocument();
  });
});
