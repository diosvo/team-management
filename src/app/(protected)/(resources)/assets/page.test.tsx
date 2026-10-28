import {
  expectNoA11yViolations,
  renderWithUI,
  screen,
  setupTestLifecycle,
} from '@/test/utilities';

import { getAssets } from '@/actions/asset';

import AssetsPage, { generateMetadata } from './page';

vi.mock('@/actions/asset', () => ({ getAssets: vi.fn() }));

vi.mock('./_components/AssetHeader', () => ({
  default: () => <div data-testid="header" />,
}));
vi.mock('./_components/AssetStats', () => ({
  default: ({ stats }: { stats: { total: number } }) => (
    <div data-testid="stats">{stats.total}</div>
  ),
}));
vi.mock('./_components/AssetFilters', () => ({
  default: () => <div data-testid="filters" />,
}));
vi.mock('./_components/AssetTable', () => ({
  default: ({ data }: { data: Array<unknown> }) => (
    <div data-testid="table">{data.length}</div>
  ),
}));

describe('AssetsPage', () => {
  const mockGetAssets = vi.mocked(getAssets);

  setupTestLifecycle();

  beforeEach(() => {
    mockGetAssets.mockResolvedValue({
      stats: { total: 3 },
      data: [{ asset_id: '1' }],
    } as never);
  });

  test('exposes page metadata', async () => {
    const metadata = await generateMetadata();

    expect(metadata.title).toBe('Assets');
  });

  test('should be accessible', async () => {
    const { container } = renderWithUI(await AssetsPage());

    await expectNoA11yViolations(container);
  });

  test('renders every section with the fetched data', async () => {
    renderWithUI(await AssetsPage());

    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('stats')).toHaveTextContent('3');
    expect(screen.getByTestId('filters')).toBeInTheDocument();
    expect(screen.getByTestId('table')).toHaveTextContent('1');
  });
});
