import { renderWithUI, screen } from '@/test/utilities';

import AchievementsLoading from './loading';

vi.mock('./_components/AchievementHero', () => ({
  default: () => <div data-testid="achievement-hero" />,
}));

vi.mock('./_components/AchievementFooter', () => ({
  default: () => <div data-testid="achievement-footer" />,
}));

describe('AchievementsLoading', () => {
  test('renders the record action, hero, timeline placeholder and footer', () => {
    renderWithUI(<AchievementsLoading />);

    expect(
      screen.getByRole('button', { name: /record/i }),
    ).toBeInTheDocument();
    expect(screen.getByTestId('achievement-hero')).toBeInTheDocument();
    expect(screen.getByTestId('achievement-footer')).toBeInTheDocument();
  });
});
