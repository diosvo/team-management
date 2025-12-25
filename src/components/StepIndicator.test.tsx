import { axe } from 'jest-axe';

import { renderWithUI, screen } from '@/test/utilities';
import StepIndicator from './StepIndicator';

describe('StepIndicator', () => {
  const setup = (step: number) => {
    const view = renderWithUI(<StepIndicator step={step} />);
    return view;
  };

  test('should be accessible', async () => {
    const { container } = setup(1);

    const result = await axe(container);
    expect(result).toHaveNoViolations();
  });

  test('renders step number correctly', () => {
    setup(1);

    const stepElement = screen.getByText('1');

    expect(stepElement).toBeInTheDocument();
    expect(stepElement.tagName).toBe('SPAN');
  });

  test('renders with different step numbers', () => {
    const cases = [
      { step: 1 },
      { step: 2 },
      { step: 3 },
      { step: 5 },
      { step: 10 },
    ];

    cases.forEach(({ step }) => {
      const { unmount } = setup(step);

      expect(screen.getByText(step.toString())).toBeInTheDocument();
      unmount();
    });
  });
});
