import ListPageSkeleton from '@/components/PageSkeleton';

export default function AttendanceLoading() {
  return (
    <ListPageSkeleton
      title="Training Attendance"
      actions={['Mark Attendance']}
      stats={4}
      toolbar={{ date: 'Today', filters: true }}
      columns={6}
    />
  );
}
