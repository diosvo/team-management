import { getYearsActive } from '@/app/(protected)/_helpers/utils';
import { renderWithUI, screen } from '@/test/utilities';

import AchievementHero from './AchievementHero';

vi.mock('next/font/google', () => ({
  Anton: () => ({ className: 'anton', style: { fontFamily: 'Anton' } }),
}));

vi.mock('next/image', () => ({
  default: ({ alt, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} {...props} />
  ),
}));

vi.mock('@/assets/images/prd-logo.png', () => ({
  default: { src: '/mock-logo.png', height: 88, width: 88, blurDataURL: '' },
}));

vi.mock('@/assets/images/bg-layer.webp', () => ({
  default: { src: '/mock-layer.webp', height: 40, width: 40, blurDataURL: '' },
}));

describe('AchievementHero', () => {
  const setup = () => renderWithUI(<AchievementHero />);

  test('renders the club logo and the headline', () => {
    setup();

    expect(screen.getByAltText('Team Logo')).toBeInTheDocument();
    expect(screen.getByText('Our Journey. Our Pride.')).toBeInTheDocument();
    expect(
      screen.getByText('Every season. Every challenge. Every achievement.'),
    ).toBeInTheDocument();
  });

  test('counts the seasons played since the club was founded', () => {
    setup();

    expect(
      screen.getAllByText(new RegExp(getYearsActive, 'i')).length,
    ).toBeGreaterThan(0);
    expect(screen.getAllByText(/of playing together/i).length).toBeGreaterThan(
      0,
    );
  });
});
