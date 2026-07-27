import { renderWithUI, screen } from '@/test/utilities';

import AppHeader from './AppHeader';

vi.mock('./AccountMenu', () => ({
  default: () => <div data-testid="account-menu" />,
}));

vi.mock('./MobileSidebar', () => ({
  default: () => <div data-testid="mobile-sidebar" />,
}));

vi.mock('next/image', () => ({
  default: ({ alt, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} {...props} />
  ),
}));

vi.mock('@/assets/images/header-logo.webp', () => ({
  default: { src: '/mock-logo.webp', height: 40, width: 192, blurDataURL: '' },
}));

describe('AppHeader', () => {
  const setup = () => renderWithUI(<AppHeader />);

  test('renders the logo with the correct alt text', () => {
    setup();

    expect(screen.getByAltText('Text Logo')).toBeInTheDocument();
  });

  test('renders the AccountMenu', () => {
    setup();

    expect(screen.getByTestId('account-menu')).toBeInTheDocument();
  });

  test('renders the MobileSidebar', () => {
    setup();

    expect(screen.getByTestId('mobile-sidebar')).toBeInTheDocument();
  });
});
