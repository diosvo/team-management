import ListPageSkeleton from '@/components/PageSkeleton';

export default function Loading() {
  return (
    <ListPageSkeleton
      title="Team Roster"
      actions={['Add']}
      toolbar={{ filters: true }}
      columns={8}
    />
  );
}
