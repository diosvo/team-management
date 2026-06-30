import * as nuqs from 'nuqs';
import { Mock } from 'vitest';

import { MOCK_ASSET_STATS } from '@/test/mocks/asset';
import { axeInteractiveStat, renderWithUI, screen } from '@/test/utilities';

import { useAssetFilters } from '@/lib/nuqs';
import { AssetCondition } from '@/utils/enum';

import AssetStats from './AssetStats';

describe('AssetStats', () => {
  const setSearchParams = vi.fn();

  const setup = (stats = MOCK_ASSET_STATS) => {
    (nuqs.useQueryStates as unknown as Mock).mockReturnValue([
      {},
      setSearchParams,
    ]);

    return renderWithUI(<AssetStats stats={stats} />);
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should be accessible', async () => {
    const { container } = setup();

    const result = await axeInteractiveStat(container);
    expect(result).toHaveNoViolations();
  });

  test('renders all stat cards with their labels', () => {
    setup();

    expect(screen.getByText('Total Quantity')).toBeInTheDocument();
    expect(screen.getByText('Need Replacement')).toBeInTheDocument();
    expect(screen.getByText('Outdated')).toBeInTheDocument();
  });

  test('renders the stat values and pluralizes the item unit', () => {
    setup({ total_items: 10, need_replacement: 2, obsolete_count: 1 });

    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    // total (10) + need_replacement (2) are plural, obsolete (1) is singular
    expect(screen.getAllByText('items')).toHaveLength(2);
    expect(screen.getByText('item')).toBeInTheDocument();
  });

  test('resets the filters when the total quantity card is clicked', async () => {
    const { user } = setup();

    await user.click(screen.getByText('Total Quantity'));

    expect(setSearchParams).toHaveBeenCalledWith(null);
  });

  test('filters by poor condition when need replacement is clicked', async () => {
    const { user } = setup({ ...MOCK_ASSET_STATS, need_replacement: 2 });

    await user.click(screen.getByText('Need Replacement'));

    expect(setSearchParams).toHaveBeenCalledWith({
      ...useAssetFilters.defaults,
      condition: [AssetCondition.POOR],
    });
  });

  test('does not filter when a stat card with a value of 0 is clicked', async () => {
    const { user } = setup({ ...MOCK_ASSET_STATS, obsolete_count: 0 });

    await user.click(screen.getByText('Outdated'));

    expect(setSearchParams).not.toHaveBeenCalled();
  });
});
