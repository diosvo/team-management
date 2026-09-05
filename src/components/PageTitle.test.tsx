import { expectNoA11yViolations, renderWithUI, screen } from '@/test/utilities';
import PageTitle from './PageTitle';

describe('PageTitle', () => {
  const setup = (title: string) => {
    const component = renderWithUI(<PageTitle title={title} />);
    const container = component.container;

    return {
      container,
      heading: container.querySelector('h2'),
    };
  };

  test('should be accessible', async () => {
    const { container } = setup('Access');

    await expectNoA11yViolations(container);
  });

  test('renders the title correctly', () => {
    const { heading } = setup('Dashboard');

    expect(heading).toBeInTheDocument();
    expect(heading).toHaveClass('chakra-heading');
  });

  test('renders the squiggle image with correct attributes', () => {
    setup('Dashboard');

    const [image] = screen.getAllByAltText('Squiggle');

    expect(image).toBeInTheDocument();
    expect(image).toHaveClass('chakra-image');
    expect(image).toHaveAttribute('loading', 'lazy');
    expect(image).toHaveAttribute('src', '/squiggle.svg');
  });
});
