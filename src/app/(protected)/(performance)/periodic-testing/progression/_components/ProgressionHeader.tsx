import Link from 'next/link';

import { Button } from '@chakra-ui/react';
import { Settings2, Table2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

import Authorized from '@/components/Authorized';
import PageHeader from '@/components/PageHeader';

export default function ProgressionHeader() {
  const t = useTranslations('periodicTesting.progression');

  return (
    <PageHeader title={t('title')}>
      <Authorized resource="periodic-testing" action="create">
        <Button variant="surface" asChild>
          <Link href="/periodic-testing/test-types">
            <Settings2 size={14} />
            {t('manageTypes')}
          </Link>
        </Button>
      </Authorized>
      <Button asChild>
        <Link href="/periodic-testing">
          <Table2 size={14} />
          {t('results')}
        </Link>
      </Button>
    </PageHeader>
  );
}
