import { axe, toHaveNoViolations } from 'jest-axe';

import { render } from '@/test/utilities';
import Visibility from './Visibility';

expect.extend(toHaveNoViolations);

describe('Visibility', () => {
  const setup = (isVisible: boolean) => {
    const component = render(
      <Visibility isVisible={isVisible}>
        <div>{isVisible ? 'Visible' : 'Hidden'} content</div>
      </Visibility>,
    );

    return {
      container: component.container,
      content: component.getByText(/content/),
    };
  };

  test('should be accessible', async () => {
    const { container } = setup(true);

    const result = await axe(container);
    expect(result).toHaveNoViolations();
  });

  test('renders children when isVisible is true', () => {
    const { content } = setup(true);

    expect(content).toBeInTheDocument();
    expect(content).toHaveStyle('display: block');
  });

  test('does not render children when isVisible is false', () => {
    const { content } = setup(false);

    expect(content).toBeInTheDocument();
    expect(content).toHaveStyle('display: none');
  });
});
