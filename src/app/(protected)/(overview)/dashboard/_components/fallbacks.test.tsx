import { renderWithUI, screen } from '@/test/utilities';

import { CardFallback, ChartFallback, UpcomingFallback } from './fallbacks';

describe('fallbacks', () => {
  test('renders CardFallback', () => {
    const { container } = renderWithUI(<CardFallback />);

    expect(container.firstChild).toBeInTheDocument();
  });

  test('renders ChartFallback', () => {
    const { container } = renderWithUI(<ChartFallback />);

    expect(container.firstChild).toBeInTheDocument();
  });

  test('renders UpcomingFallback for upcoming sessions', () => {
    renderWithUI(<UpcomingFallback section="upcomingSessions" />);

    expect(screen.getByText('Upcoming Sessions')).toBeInTheDocument();
    expect(screen.getByText('Next 3 training sessions')).toBeInTheDocument();
  });

  test('renders UpcomingFallback for upcoming matches', () => {
    renderWithUI(<UpcomingFallback section="upcomingMatches" />);

    expect(screen.getByText('Upcoming Matches')).toBeInTheDocument();
    expect(screen.getByText('Next 3 scheduled games')).toBeInTheDocument();
  });
});
