import { render } from '@testing-library/react';
import Visibility from './Visibility';

describe('Visibility', () => {
  const setup = (isVisible: boolean) => {
    const component = render(
      <Visibility isVisible={isVisible}>
        <div>{isVisible ? 'Visible' : 'Hidden'} content</div>
      </Visibility>,
    );
    const content = component.getByText(/content/);
    return content;
  };

  test('renders children when isVisible is true', () => {
    const content = setup(true);

    expect(content).toBeInTheDocument();
    expect(content).toHaveStyle('display: block');
  });

  test('does not render children when isVisible is false', () => {
    const content = setup(false);

    expect(content).toBeInTheDocument();
    expect(content).toHaveStyle('display: none');
  });
});
