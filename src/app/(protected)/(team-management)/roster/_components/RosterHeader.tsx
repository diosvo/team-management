import { useTranslations } from 'next-intl';

import Authorized from '@/components/Authorized';
import PageHeader from '@/components/PageHeader';

import AddUser from './AddUser';

export default function RosterHeader() {
  const t = useTranslations('roster');

  return (
    <PageHeader title={t('title')}>
      <Authorized resource="roster" action="create">
        <AddUser />
      </Authorized>
    </PageHeader>
  );
}
