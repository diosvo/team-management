import { axe } from 'jest-axe';

import { renderWithUI, screen } from '@/test/utilities';

import TestingStats from './TestingStats';

describe('TestingStats', () => {
  const setup = (stats = { total_players: 5, completed_tests: 3 }) =>
    renderWithUI(<TestingStats stats={stats} />);

  test('should be accessible', async () => {
    const { container } = setup();

    const result = await axe(container);
    expect(result).toHaveNoViolations();
  });

  test('renders all stat cards with their labels', () => {
    setup();

    expect(screen.getByText('Players Joined')).toBeInTheDocument();
    expect(screen.getByText('Completed Tests')).toBeInTheDocument();
  });

  test('renders the stat values with pluralized units', () => {
    setup();

    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('players')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('tests')).toBeInTheDocument();
  });

  test('hides the unit when the value is 0', () => {
    setup({ total_players: 0, completed_tests: 0 });

    expect(screen.queryByText('players')).not.toBeInTheDocument();
    expect(screen.queryByText('tests')).not.toBeInTheDocument();
  });
});
