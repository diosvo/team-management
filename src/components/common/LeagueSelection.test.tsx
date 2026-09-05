import { expectNoA11yViolations, renderWithUI, screen } from '@/test/utilities';

import { LeagueLink } from './LeagueSelection';

describe('LeagueLink', () => {
  const setup = (name: string | null | undefined) =>
    renderWithUI(<LeagueLink name={name} />);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should be accessible when a name is provided', async () => {
    const { container } = setup('Premier League');

    await expectNoA11yViolations(container);
  });

  test('renders a dash when name is null', () => {
    setup(null);

    expect(screen.getByText('-')).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  test('renders a dash when name is undefined', () => {
    setup(undefined);

    expect(screen.getByText('-')).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  test('renders the name as a link', () => {
    setup('Premier League');

    expect(
      screen.getByRole('link', { name: 'Premier League' }),
    ).toBeInTheDocument();
  });

  test('builds the href with the URL-encoded league name', () => {
    setup('Premier League');

    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      '/leagues?q=Premier%20League',
    );
  });

  test('encodes special characters in the league name', () => {
    setup('A & B');

    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      '/leagues?q=A%20%26%20B',
    );
  });

  test('opens in a new tab', () => {
    setup('Premier League');

    expect(screen.getByRole('link')).toHaveAttribute('target', '_blank');
  });

  test('has rel="noopener noreferrer"', () => {
    setup('Premier League');

    expect(screen.getByRole('link')).toHaveAttribute(
      'rel',
      'noopener noreferrer',
    );
  });

  test('stops click propagation', async () => {
    const parentClick = vi.fn();
    const { user } = renderWithUI(
      <div onClick={parentClick}>
        <LeagueLink name="Premier League" />
      </div>,
    );

    await user.click(screen.getByRole('link'));

    expect(parentClick).not.toHaveBeenCalled();
  });
});
