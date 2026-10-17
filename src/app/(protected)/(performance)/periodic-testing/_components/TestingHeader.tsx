import Link from 'next/link';

import { Button } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { Plus, Settings2 } from 'lucide-react';

import Authorized from '@/components/Authorized';
import PageHeader from '@/components/PageHeader';

export default function TestingHeader() {
  const t = useTranslations('periodicTesting.header');

  return (
    <PageHeader title={t('title')}>
      <Authorized resource="periodic-testing" action="create">
        <Button variant="surface" asChild>
          <Link href="/periodic-testing/test-types">
            <Settings2 size={14} />
            {t('manageTypes')}
          </Link>
        </Button>
        <Button asChild>
          <Link href="/periodic-testing/add-result">
            <Plus size={14} />
            {t('addResult')}
          </Link>
        </Button>
      </Authorized>
    </PageHeader>
  );
}
