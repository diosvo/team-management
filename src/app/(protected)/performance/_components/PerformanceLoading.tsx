import { HeaderSkeleton, StatsSkeleton } from './PerformanceSkeleton';
import PerformanceTabs from './PerformanceTabs';

/** Everything below the header: the real tab bar over the URL tab's skeleton. */
export function BodySkeleton() {
  return (
    <>
      <StatsSkeleton />
      <PerformanceTabs />
    </>
  );
}

/** Whole-page placeholder for `loading.tsx`, before params are known. */
export default function PerformanceLoading() {
  return (
    <>
      <HeaderSkeleton />
      <BodySkeleton />
    </>
  );
}
