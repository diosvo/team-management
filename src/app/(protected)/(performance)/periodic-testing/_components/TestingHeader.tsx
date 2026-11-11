import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Button } from '@chakra-ui/react';
import { Plus, Settings2, TrendingUp } from 'lucide-react';

import Authorized from '@/components/Authorized';
import PageHeader from '@/components/PageHeader';

export default function TestingHeader() {
  const t = useTranslations('periodicTesting.header');

  return (
    <PageHeader title={t('title')}>
      <Button variant="outline" colorPalette="blue" asChild>
        <Link href="/periodic-testing/progression">
          <TrendingUp size={14} />
          {t('progression')}
        </Link>
      </Button>
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
