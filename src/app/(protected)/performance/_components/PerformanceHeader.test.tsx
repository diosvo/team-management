import {
  expectNoA11yViolations,
  renderWithUI,
  screen,
  setupTestLifecycle,
} from '@/test/utilities';
import { MOCK_PERFORMANCE_IDENTITY } from '@/test/mocks/performance';

import { useSelection } from '@/i18n/enums';
import type { PerformanceIdentity } from '@/types/performance';
import { PlayerPosition } from '@/utils/enum';

import PerformanceHeader from './PerformanceHeader';

vi.mock('@/i18n/enums', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/i18n/enums')>();
  return { ...actual, useSelection: vi.fn(actual.useSelection) };
});

vi.mock('./PerformanceFilters', () => ({
  default: () => <div data-testid="filters" />,
}));

describe('PerformanceHeader', () => {
  setupTestLifecycle();

  const setup = (identity: Partial<PerformanceIdentity> = {}) =>
    renderWithUI(
      <PerformanceHeader
        identity={{ ...MOCK_PERFORMANCE_IDENTITY, ...identity }}
      />,
    );

  test('should be accessible', async () => {
    const { container } = setup();

    await expectNoA11yViolations(container);
  });

  test('renders your own page with every badge and the filters', () => {
    setup();

    expect(
      screen.getByRole('heading', { name: /My Performance/ }),
    ).toBeInTheDocument();
    expect(screen.getByText('#7')).toBeInTheDocument();
    expect(screen.getByText('Center')).toBeInTheDocument();
    expect(screen.getByText('Captain')).toBeInTheDocument();
    expect(screen.getByTestId('filters')).toBeInTheDocument();
  });

  test('hides the badges and filters that do not apply', () => {
    setup({
      is_own: false,
      is_player: false,
      is_captain: false,
      jersey_number: null,
      position: PlayerPosition.UNKNOWN,
    });

    expect(
      screen.getByRole('heading', { name: /^Performance/ }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/^#/)).not.toBeInTheDocument();
    expect(screen.queryByText('Unknown')).not.toBeInTheDocument();
    expect(screen.queryByText('Captain')).not.toBeInTheDocument();
    expect(screen.queryByTestId('filters')).not.toBeInTheDocument();
  });

  test('hides the position when none is set', () => {
    setup({ position: null });

    expect(screen.queryByText('Center')).not.toBeInTheDocument();
  });

  test('falls back to the position label when it has no description', () => {
    vi.mocked(useSelection).mockReturnValueOnce([
      { label: 'C', value: PlayerPosition.CENTER },
    ]);
    setup();

    expect(screen.getByText('C')).toBeInTheDocument();
  });

  test('falls back to the raw position when it is not selectable', () => {
    setup({ position: 'sixth_man' });

    expect(screen.getByText('sixth_man')).toBeInTheDocument();
  });
});
