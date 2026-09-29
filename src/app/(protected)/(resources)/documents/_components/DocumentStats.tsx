'use client';

import { useTranslations } from 'next-intl';

import { SELECTABLE_DOCUMENT_TYPES } from '@/utils/constants';
import { getColor } from '@/utils/helper';

import { useDocumentFilters } from '@/lib/nuqs';

import { Stat, StatGroup } from '@/components/ui/stat';
import type { DocumentStatsValues } from '@/db/document';

/** Total, then one tile per type; a tile filters the grid by its type. */
export default function DocumentStats({
  stats,
}: {
  stats: DocumentStatsValues;
}) {
  const t = useTranslations('documents.stats');
  const [params, setSearchParams] = useDocumentFilters();

  return (
    <StatGroup>
      <Stat
        label={t('total')}
        value={stats.total}
        unit={t('unit.document')}
        onClick={() => setSearchParams(null)}
      />
      {SELECTABLE_DOCUMENT_TYPES.map((type) => (
        <Stat
          key={type}
          label={t(`type.${type}`)}
          value={stats[type]}
          unit={t(`unit.${type}`)}
          color={getColor(type)}
          onClick={() => setSearchParams({ ...params, type: [type], page: 1 })}
        />
      ))}
    </StatGroup>
  );
}
