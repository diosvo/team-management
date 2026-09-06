import { render } from '@/test/utilities';

import { Timestamp } from './Timestamp';

describe('Timestamp', () => {
  test('renders the current year', () => {
    const { container } = render(<Timestamp />);

    expect(container.textContent).toBe(String(new Date().getFullYear()));
  });
});
