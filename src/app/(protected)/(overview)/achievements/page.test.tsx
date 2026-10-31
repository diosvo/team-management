import {
  expectNoA11yViolations,
  renderWithUI,
  screen,
  setupTestLifecycle,
} from '@/test/utilities';

import { getAchievements } from '@/actions/achievement';

import AchievementsPage, { generateMetadata } from './page';

vi.mock('@/actions/achievement', () => ({ getAchievements: vi.fn() }));

vi.mock('./_components/AchievementHeader', () => ({
  default: () => <div data-testid="header" />,
}));
vi.mock('./_components/AchievementHero', () => ({
  default: () => <div data-testid="hero" />,
}));
vi.mock('./_components/AchievementTimeline', () => ({
  default: ({ achievements }: { achievements: Array<unknown> }) => (
    <div data-testid="timeline">{achievements.length}</div>
  ),
}));
vi.mock('./_components/AchievementFooter', () => ({
  default: () => <div data-testid="footer" />,
}));

describe('AchievementsPage', () => {
  const mockGetAchievements = vi.mocked(getAchievements);

  setupTestLifecycle();

  test('exposes page metadata', async () => {
    mockGetAchievements.mockResolvedValue([]);

    const metadata = await generateMetadata();

    expect(metadata.title).toBe('Achievements');
  });

  test('should be accessible', async () => {
    mockGetAchievements.mockResolvedValue([]);

    const { container } = renderWithUI(await AchievementsPage());

    await expectNoA11yViolations(container);
  });

  test('does not render the footer when there are no achievements', async () => {
    mockGetAchievements.mockResolvedValue([]);

    renderWithUI(await AchievementsPage());

    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('hero')).toBeInTheDocument();
    expect(screen.getByTestId('timeline')).toHaveTextContent('0');
    expect(screen.queryByTestId('footer')).not.toBeInTheDocument();
  });

  test('renders the footer when achievements exist', async () => {
    mockGetAchievements.mockResolvedValue([{ achievement_id: '1' }] as never);

    renderWithUI(await AchievementsPage());

    expect(screen.getByTestId('timeline')).toHaveTextContent('1');
    expect(screen.getByTestId('footer')).toBeInTheDocument();
  });
});
