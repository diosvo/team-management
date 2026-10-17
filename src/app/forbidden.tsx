import Link from 'next/link';

import { Button, Center } from '@chakra-ui/react';
import { LockKeyhole } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { EmptyState } from '@/components/ui/empty-state';
import { DEFAULT_LOGIN_REDIRECT } from '@/routes';

export default function Forbidden() {
  const t = useTranslations('shell.forbidden');

  return (
    <Center>
      <EmptyState
        size="lg"
        icon={<LockKeyhole color="red" />}
        title={t('title')}
        description={t('description')}
      >
        <Button variant="subtle" asChild>
          <Link href={DEFAULT_LOGIN_REDIRECT}>{t('returnDashboard')}</Link>
        </Button>
      </EmptyState>
    </Center>
  );
}
