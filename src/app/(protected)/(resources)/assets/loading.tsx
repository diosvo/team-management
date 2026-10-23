import ListPageSkeleton from '@/components/PageSkeleton';

export default function Loading() {
  return (
    <ListPageSkeleton
      title="Assets"
      actions={['Add']}
      stats={3}
      toolbar={{ date: 'All time', filters: true }}
      columns={9}
    />
  );
}
