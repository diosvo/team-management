import ListPageSkeleton from '@/components/PageSkeleton';

export default function TrainingSessionsLoading() {
  return (
    <ListPageSkeleton
      title="Training Sessions"
      actions={['New Session']}
      stats={3}
      toolbar={{ date: 'This year', filters: true }}
      columns={6}
    />
  );
}
