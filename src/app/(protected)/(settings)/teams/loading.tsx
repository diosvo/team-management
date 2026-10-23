import ListPageSkeleton from '@/components/PageSkeleton';

export default function Loading() {
  return <ListPageSkeleton title="Teams" actions={['Add']} columns={5} />;
}
