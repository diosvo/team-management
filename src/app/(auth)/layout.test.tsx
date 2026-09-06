import {
  renderWithUI,
  screen,
  setupTestLifecycle,
  waitFor,
} from '@/test/utilities';

import BackgroundLayer from '@/assets/images/bg-layer.webp';

import AuthLayout from './layout';

describe('AuthLayout', () => {
  setupTestLifecycle();

  const setup = async (children = <div>Test Content</div>) => {
    return renderWithUI(await AuthLayout({ children }));
  };

  test('renders the background image', async () => {
    await setup();

    await waitFor(() => {
      const image = screen.getByAltText(
        'Saigon Rovers Basketball Club Background Layer',
      );
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', BackgroundLayer.src);
    });
  });

  test('renders children inside the container', async () => {
    await setup(<div>Custom Child Content</div>);

    expect(screen.getByText('Custom Child Content')).toBeInTheDocument();
  });

  test('applies the correct container styles', async () => {
    const { container } = await setup();
    const contentContainer = container.querySelector(
      '[class*="chakra-container"]',
    );

    expect(contentContainer).toBeInTheDocument();
    expect(contentContainer).toHaveClass('chakra-container');
  });
});
