import { axe } from 'jest-axe';
import { Mail } from 'lucide-react';

import { renderWithUI, screen } from '@/test/utilities';
import TextField from './TextField';

describe('TextField', () => {
  const defaultProps = {
    label: 'Email',
    children: <span>vtmn1212@gmail.com</span>,
  };

  const setup = (overrides = {}) => {
    const props = { ...defaultProps, ...overrides };
    const view = renderWithUI(<TextField {...props} />);

    return view;
  };

  test('should be accessible', async () => {
    const { container } = setup(1);

    const result = await axe(container);
    expect(result).toHaveNoViolations();
  });

  describe('vertical direction (default)', () => {
    test('renders label and children correctly', () => {
      setup();

      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('vtmn1212@gmail.com')).toBeInTheDocument();
    });

    test('renders icon when provided', () => {
      const { container } = setup({ icon: Mail });

      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    test('does not render icon when not provided', () => {
      const { container } = setup();

      const icon = container.querySelector('svg');
      expect(icon).not.toBeInTheDocument();
    });

    test('applies correct vertical layout styles', () => {
      const { container } = setup();

      const vstack = container.querySelector('.chakra-stack');
      expect(vstack).toBeInTheDocument();
    });
  });

  describe('horizontal direction', () => {
    test('renders label and children in horizontal layout', () => {
      setup({ direction: 'horizontal' });

      expect(screen.getByText(/Email:/)).toBeInTheDocument();
      expect(screen.getByText('vtmn1212@gmail.com')).toBeInTheDocument();
    });

    test('renders icon in horizontal layout', () => {
      const { container } = setup({
        direction: 'horizontal',
        icon: Mail,
      });

      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    test('does not render icon when not provided in horizontal layout', () => {
      const { container } = setup({ direction: 'horizontal' });

      const icon = container.querySelector('svg');
      expect(icon).not.toBeInTheDocument();
    });

    test('applies correct horizontal layout styles', () => {
      const { container } = setup({ direction: 'horizontal' });

      const hstack = container.querySelector('.chakra-stack');
      expect(hstack).toBeInTheDocument();
    });
  });

  test('renders with empty children', () => {
    setup({ children: null });

    expect(screen.getByText('Email')).toBeInTheDocument();
  });

  test('renders with complex children structure', () => {
    setup({
      children: (
        <div>
          <span>Primary: test@example.com</span>
          <span>Secondary: backup@example.com</span>
        </div>
      ),
    });

    expect(screen.getByText(/Primary:/)).toBeInTheDocument();
    expect(screen.getByText(/Secondary:/)).toBeInTheDocument();
  });
});
