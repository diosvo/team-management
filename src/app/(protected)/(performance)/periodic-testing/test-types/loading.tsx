import ListPageSkeleton from '@/components/PageSkeleton';

export default function TestTypesLoading() {
  return (
    <ListPageSkeleton
      title="Test Types"
      actions={['Add']}
      toolbar={{ filters: true }}
      columns={5}
    />
  );
}
