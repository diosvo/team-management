'use client';

import { SimpleGrid, Span, Stat } from '@chakra-ui/react';

import { useAssetFilters } from '@/lib/nuqs';
import { AssetCondition } from '@/utils/enum';
import { formatValueUnit } from '@/utils/formatter';

type AssetStatsProps = {
  stats: {
    total_items: number;
    need_replacement: number;
    obsolete_count: number;
  };
};

const cardHoverStyle = {
  cursor: 'pointer',
  shadow: 'sm',
  transform: 'translateY(-2px)',
  transition: 'all 0.2s',
};

export default function AssetStats({ stats }: AssetStatsProps) {
  const [, setSearchParams] = useAssetFilters();

  const handleClick = (condition: AssetCondition) => {
    setSearchParams({ page: 1, q: '', category: [], condition: [condition] });
  };

  return (
    <>
      <SimpleGrid columns={{ base: 2, md: 4, xl: 6 }} gap={{ base: 3, lg: 4 }}>
        <Stat.Root
          borderWidth={1}
          padding={4}
          rounded="md"
          _hover={cardHoverStyle}
          onClick={() => setSearchParams(null)}
        >
          <Stat.Label>Total Quantity</Stat.Label>
          <Stat.ValueText alignItems="baseline">
            {stats.total_items}
            <Stat.ValueUnit>
              {formatValueUnit(stats.total_items, 'item')}
            </Stat.ValueUnit>
          </Stat.ValueText>
        </Stat.Root>
        <Stat.Root
          borderWidth={1}
          padding={4}
          rounded="md"
          _hover={cardHoverStyle}
          onClick={() => handleClick(AssetCondition.POOR)}
        >
          <Stat.Label>Need Replacement</Stat.Label>
          <Stat.ValueText alignItems="baseline">
            <Span color={stats.need_replacement > 0 ? 'red' : 'black'}>
              {stats.need_replacement}
            </Span>
            <Stat.ValueUnit>
              {formatValueUnit(stats.need_replacement, 'item')}
            </Stat.ValueUnit>
          </Stat.ValueText>
        </Stat.Root>
        <Stat.Root
          borderWidth={1}
          padding={4}
          rounded="md"
          _hover={cardHoverStyle}
          onClick={() => handleClick(AssetCondition.OBSOLETE)}
        >
          <Stat.Label>Outdated</Stat.Label>
          <Stat.ValueText alignItems="baseline">
            <Span color="gray">{stats.obsolete_count}</Span>
            <Stat.ValueUnit>
              {formatValueUnit(stats.obsolete_count, 'item')}
            </Stat.ValueUnit>
          </Stat.ValueText>
        </Stat.Root>
      </SimpleGrid>
    </>
  );
}
