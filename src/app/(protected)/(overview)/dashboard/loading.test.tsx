import { renderWithUI, screen } from '@/test/utilities';

import DashboardLoading from './loading';

describe('DashboardLoading', () => {
  test('renders the analytics section title and filter placeholders', () => {
    renderWithUI(<DashboardLoading />);

    expect(screen.getByText('Analytics')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /export report/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /this year/i }),
    ).toBeInTheDocument();
  });
});
