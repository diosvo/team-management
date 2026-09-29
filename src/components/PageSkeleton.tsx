import {
  HStack,
  Skeleton,
  SkeletonText,
  Stat,
  VStack,
  type StackProps,
} from '@chakra-ui/react';

import { StatGroup } from '@/components/ui/stat';

/** Placeholder for `PageHeader`: the title and, optionally, its action. */
export function TitleSkeleton({ action = false }: { action?: boolean }) {
  return (
    <HStack justifyContent="space-between">
      <Skeleton height={9} width={40} />
      {action && <Skeleton height={9} width={24} />}
    </HStack>
  );
}

/** Placeholder for a `StatGroup` with `count` cards. */
export function StatsSkeleton({ count }: { count: number }) {
  return (
    <StatGroup>
      {Array.from({ length: count }).map((_, index) => (
        <Stat.Root key={index}>
          <Skeleton width="full" height="90px" />
        </Stat.Root>
      ))}
    </StatGroup>
  );
}

/** Placeholder for the search + filters bar. */
export function FiltersSkeleton() {
  return <Skeleton height={10} width="full" />;
}

/** Placeholder for a `DataTable` with `rows` rows. */
export function TableSkeleton({ rows = 7 }: { rows?: number }) {
  return <SkeletonText noOfLines={rows} gap={2} height={10} />;
}

type ListPageSkeletonProps = Partial<{
  /** Show the header action placeholder next to the title. */
  action: boolean;
  /** Number of stat cards; omit when the page has none. */
  stats: number;
  /** Replaces the default table placeholder. */
  children: React.ReactNode;
}> &
  StackProps;

/**
 * Loading state for the standard list page: header, optional stats, filter
 * bar, then a table (or whatever `children` renders instead).
 */
export default function ListPageSkeleton({
  action,
  stats = 0,
  children,
  ...rest
}: ListPageSkeletonProps) {
  return (
    <VStack alignItems="stretch" gap={{ base: 4, lg: 6 }} {...rest}>
      <TitleSkeleton action={action} />
      {stats > 0 && <StatsSkeleton count={stats} />}
      <FiltersSkeleton />
      {children ?? <TableSkeleton />}
    </VStack>
  );
}
