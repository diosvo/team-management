import { renderWithUI, screen } from '@/test/utilities';

import AuthLayout from './layout';

describe('AuthLayout', () => {
  const setup = async (children = <div>Test Content</div>) => {
    return renderWithUI(await AuthLayout({ children }));
  };

  test('renders the background image', async () => {
    await setup();

    const image = screen.getByAltText(
      'Saigon Rovers Basketball Club Background Layer',
    );

    expect(image).toBeInTheDocument();
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
