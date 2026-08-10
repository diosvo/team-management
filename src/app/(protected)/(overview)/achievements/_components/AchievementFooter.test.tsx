import { renderWithUI, screen } from '@/test/utilities';

import AchievementFooter from './AchievementFooter';

describe('AchievementFooter', () => {
  test('renders the footer message', () => {
    renderWithUI(<AchievementFooter />);

    expect(screen.getByText('More than victories.')).toBeInTheDocument();
    expect(screen.getByText('This is our journey.')).toBeInTheDocument();
  });
});
