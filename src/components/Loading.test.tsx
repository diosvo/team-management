import { axe } from 'jest-axe';

import { renderWithUI } from '@/test/utilities';
import Loading from './Loading';

describe('Loading', () => {
  test('should be accessible', async () => {
    const { container } = renderWithUI(<Loading />);

    const result = await axe(container);
    expect(result).toHaveNoViolations();
  });

  test('renders loading progress bar with animation and no value', () => {
    const { container } = renderWithUI(<Loading />);

    const progressRoot = container.querySelector('[data-scope="progress"]');
    const progressTrack = container.querySelector('[data-part="track"]');
    const progressRange = container.querySelector('[data-part="range"]');

    expect(progressRoot).toBeInTheDocument();
    expect(progressRoot).not.toHaveAttribute('data-value');
    expect(progressTrack).toBeInTheDocument();
    expect(progressRange).toBeInTheDocument();
  });
});
