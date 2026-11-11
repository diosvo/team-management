import { getTranslations } from 'next-intl/server';
import { UserX } from 'lucide-react';

import { EmptyState } from '@/components/ui/empty-state';

export default async function NotFound() {
  const t = await getTranslations('performance.notFound');

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
