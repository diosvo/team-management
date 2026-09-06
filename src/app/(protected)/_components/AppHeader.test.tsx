import { expectNoA11yViolations, renderWithUI, screen } from '@/test/utilities';

import AppHeader from './AppHeader';

vi.mock('./AccountMenu', () => ({
  default: () => <div data-testid="account-menu" />,
}));

vi.mock('./MobileSidebar', () => ({
  default: () => <div data-testid="mobile-sidebar" />,
}));

vi.mock('@/assets/images/header-logo.webp', () => ({
  default: { src: '/mock-logo.webp', height: 40, width: 192, blurDataURL: '' },
}));

describe('AppHeader', () => {
  const setup = () => renderWithUI(<AppHeader />);

  test('should be accessible', async () => {
    const { container } = setup();

    await expectNoA11yViolations(container);
  });

  test('renders the logo with the correct alt text', () => {
    setup();

    const logo = screen.getByAltText('Text Logo');

    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute('src', '/mock-logo.webp');
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
