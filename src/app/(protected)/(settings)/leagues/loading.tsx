import ListPageSkeleton from '@/components/PageSkeleton';

export default function Loading() {
  return (
    <ListPageSkeleton
      title="Leagues"
      actions={['Add']}
      toolbar={{ filters: true }}
      columns={7}
    />
  );
}
