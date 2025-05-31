import { UserX } from 'lucide-react';

import { EmptyState } from '@/components/ui/empty-state';

export default function NotFound() {
  return (
    <EmptyState
      icon={<UserX />}
      borderWidth={1}
      borderRadius="md"
      title="User not found"
      description="The profile you are looking for does not exist or has been removed."
    />
  );
}
