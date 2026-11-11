import { useTranslations } from 'next-intl';
import { Badge, Span } from '@chakra-ui/react';

import {
  PERFORMANCE_BAND_COLOR,
  PROGRESS_STATUS_COLOR,
} from '@/utils/constants';
import type { PerformanceBand, ProgressStatus } from '@/utils/enum';
import { formatChange } from '@/utils/progression';

import { enumLabel } from '@/i18n/enums';

export function StatusBadge({ status }: { status: ProgressStatus }) {
  const t = useTranslations('enums');

  return (
    <Badge
      variant="surface"
      borderRadius="full"
      colorPalette={PROGRESS_STATUS_COLOR[status]}
    >
      {enumLabel(t, 'progressStatus', status)}
    </Badge>
  );
}

export function BandBadge({ band }: { band: Nullable<PerformanceBand> }) {
  const t = useTranslations('enums');

  if (!band) return '-';

  return (
    <Badge
      variant="outline"
      borderRadius="full"
      colorPalette={PERFORMANCE_BAND_COLOR[band]}
    >
      {enumLabel(t, 'performanceBand', band)}
    </Badge>
  );
}

/** Direction-adjusted change: green is always better, whatever the unit. */
export function ChangeText({
  change,
  count,
}: {
  change: number;
  count: number;
}) {
  if (count < 2) return '-';

  return (
    <Span
      fontVariantNumeric="tabular-nums"
      color={change > 0 ? 'green.600' : change < 0 ? 'red.600' : 'GrayText'}
    >
      {formatChange(change)}
    </Span>
  );
}
