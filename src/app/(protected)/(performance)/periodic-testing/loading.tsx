import ListPageSkeleton from '@/components/PageSkeleton';

export default function Loading() {
  return (
    <ListPageSkeleton
      title="Periodic Testing"
      actions={['Manage Types', 'Add Result']}
      stats={2}
      // The date select sits in the actions slot; no categorical filters.
      toolbar={{ action: '01/01/2026' }}
      columns={6}
    />
  );
}
