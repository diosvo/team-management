'use client';

import type { ReactNode } from 'react';

import { Tabs } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';

import { usePerformanceFilters } from '@/lib/nuqs';
import {
  PERFORMANCE_TAB_SELECTION,
  type PerformanceTab,
} from '@/utils/constants';

type PerformanceTabsProps = Record<PerformanceTab, ReactNode>;

/**
 * Tab shell for server-rendered sections. Keeps the active tab in the URL.
 */
export default function PerformanceTabs(sections: PerformanceTabsProps) {
  const t = useTranslations('performance.tabs');
  const [{ tab }, setSearchParams] = usePerformanceFilters();

  return (
    <Tabs.Root
      value={tab}
      variant="enclosed"
      size={{ base: 'sm', md: 'md' }}
      fitted
      lazyMount
      unmountOnExit
      onValueChange={({ value }) =>
        setSearchParams({ tab: value as PerformanceTab, page: 1 })
      }
    >
      <Tabs.List>
        {PERFORMANCE_TAB_SELECTION.map(({ value }) => (
          <Tabs.Trigger key={value} value={value}>
            {t(value)}
          </Tabs.Trigger>
        ))}
      </Tabs.List>

      {PERFORMANCE_TAB_SELECTION.map(({ value }) => (
        <Tabs.Content key={value} value={value}>
          {sections[value]}
        </Tabs.Content>
      ))}
    </Tabs.Root>
  );
}
