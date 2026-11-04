'use client';

import type { ReactNode } from 'react';

import { Tabs } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';

import { usePerformanceFilters } from '@/lib/nuqs';
import {
  PERFORMANCE_TAB_SELECTION,
  type PerformanceTab,
} from '@/utils/constants';

import { SECTION_SKELETONS } from './PerformanceSkeleton';

type PerformanceTabsProps = {
  /** The tab the server rendered `children` for. */
  active?: PerformanceTab;
  children?: ReactNode;
};

/**
 * Tab bar over the one section the server rendered. Picking a tab navigates,
 * so only that tab's data is fetched; its skeleton shows until it arrives.
 * Without `children` this is the loading state for the tab in the URL.
 */
export default function PerformanceTabs({
  active,
  children,
}: PerformanceTabsProps) {
  const t = useTranslations('performance.tabs');
  const [{ tab }, setSearchParams] = usePerformanceFilters();
  const SectionSkeleton = SECTION_SKELETONS[tab];

  return (
    <Tabs.Root
      value={tab}
      variant="enclosed"
      size={{ base: 'sm', md: 'md' }}
      fitted
      onValueChange={({ value }) =>
        setSearchParams(
          { tab: value as PerformanceTab, page: 1 },
          { shallow: false },
        )
      }
    >
      <Tabs.List>
        {PERFORMANCE_TAB_SELECTION.map(({ value }) => (
          <Tabs.Trigger key={value} value={value}>
            {t(value)}
          </Tabs.Trigger>
        ))}
      </Tabs.List>

      <Tabs.Content value={tab}>
        {tab === active && children ? children : <SectionSkeleton />}
      </Tabs.Content>
    </Tabs.Root>
  );
}
