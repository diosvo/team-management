import { renderWithUI, screen } from '@/test/utilities';

import Weekday from './Weekday';

describe('Weekday', () => {
  test('shows the weekday and reserves room for the longest short name', () => {
    renderWithUI(<Weekday date="2026-03-02" fontSize="sm" />);

    expect(screen.getByText('Mon')).toHaveAttribute('aria-hidden', 'false');
    expect(screen.getByText('Wed')).toHaveAttribute('aria-hidden', 'true');
  });
});
