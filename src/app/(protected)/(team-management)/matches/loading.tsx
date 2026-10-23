import ListPageSkeleton from '@/components/PageSkeleton';

export default function Loading() {
  return (
    <ListPageSkeleton
      title="Matches"
      actions={['Add']}
      stats={5}
      toolbar={{ date: 'This year', filters: true }}
      columns={8}
    />
  );
}
