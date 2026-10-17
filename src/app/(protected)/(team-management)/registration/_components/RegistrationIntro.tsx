import { Span } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';

import PageTitle from '@/components/PageTitle';

/** Static page intro, shared with `loading.tsx` so it never shifts. */
export default function RegistrationIntro() {
  const t = useTranslations('registration');

  return (
    <>
      <PageTitle title={t('title')} />
      <Span fontSize="sm" color="fg.muted">
        {t('subtitle')}
      </Span>
    </>
  );
}
