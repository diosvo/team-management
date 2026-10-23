import ListPageSkeleton from '@/components/PageSkeleton';

export default function Loading() {
  return <ListPageSkeleton title="Locations" actions={['Add']} columns={4} />;
}
