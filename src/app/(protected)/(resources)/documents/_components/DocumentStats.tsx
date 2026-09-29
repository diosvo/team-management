'use client';

import { useTranslations } from 'next-intl';

import { DocumentType } from '@/utils/enum';

import { useDocumentFilters } from '@/lib/nuqs';

import { Stat, StatGroup } from '@/components/ui/stat';

export type DocumentStatsValues = {
  total: number;
  albums: number;
  videos: number;
  tactics: number;
  files: number;
};

export default function DocumentStats({
  stats,
}: {
  stats: DocumentStatsValues;
}) {
  const t = useTranslations('documents.stats');
  const [params, setSearchParams] = useDocumentFilters();

  const filterByType = (type: DocumentType) => {
    setSearchParams({ ...params, type: [type], page: 1 });
  };

  return (
    <StatGroup>
      <Stat
        label={t('total')}
        value={stats.total}
        unit={t('unit.document')}
        onClick={() => setSearchParams(null)}
      />
      <Stat
        label={t('albums')}
        value={stats.albums}
        unit={t('unit.album')}
        color="blue"
        onClick={() => filterByType(DocumentType.ALBUM)}
      />
      <Stat
        label={t('videos')}
        value={stats.videos}
        unit={t('unit.video')}
        color="purple"
        onClick={() => filterByType(DocumentType.VIDEO)}
      />
      <Stat
        label={t('tactics')}
        value={stats.tactics}
        unit={t('unit.tactic')}
        color="orange"
        onClick={() => filterByType(DocumentType.TACTIC)}
      />
      <Stat
        label={t('files')}
        value={stats.files}
        unit={t('unit.file')}
        color="gray"
        onClick={() => filterByType(DocumentType.FILE)}
      />
    </StatGroup>
  );
}
