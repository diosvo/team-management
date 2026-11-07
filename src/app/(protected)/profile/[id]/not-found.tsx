import { useTranslations } from 'next-intl';
import { UserX } from 'lucide-react';

import { EmptyState } from '@/components/ui/empty-state';

export default function NotFound() {
  const t = useTranslations('profile.notFound');

  return (
    <EmptyState
      icon={<UserX />}
      borderWidth={1}
      borderRadius="md"
      title={t('title')}
      description={t('description')}
    />
  );
}
