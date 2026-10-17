import { Button, HStack, Skeleton, SkeletonText } from '@chakra-ui/react';
import { Copy } from 'lucide-react';
import { useTranslations } from 'next-intl';

import PageTitle from '@/components/PageTitle';

// Mirrors `TextEditor` in preview mode: title + copy action, then the content.
export default function Loading() {
  const t = useTranslations('teamRule');
  const tEditor = useTranslations('components.textEditor');

  return (
    <>
      <HStack justifyContent="space-between" flexWrap="wrap">
        <PageTitle title={t('title')} />
        <Skeleton>
          <Button size="sm">
            <Copy />
            {tEditor('copy')}
          </Button>
        </Skeleton>
      </HStack>
      <SkeletonText noOfLines={16} gap={4} />
    </>
  );
}
