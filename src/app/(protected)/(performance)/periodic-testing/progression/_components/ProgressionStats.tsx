import { useTranslations } from 'next-intl';

import { PerformanceBand, ProgressStatus } from '@/utils/enum';
import { formatResult, unitLabel } from '@/utils/progression';

import { Stat, StatGroup } from '@/components/ui/stat';
import type { TypeProgression } from '@/types/periodic-testing';

export default function ProgressionStats({
  progression,
}: {
  progression: Nullable<TypeProgression>;
}) {
  const t = useTranslations('periodicTesting.progression');
  const tStats = useTranslations('periodicTesting.stats');
  const players = progression?.players ?? [];
  const count = (predicate: (player: (typeof players)[number]) => boolean) =>
    players.filter(predicate).length;

  const improving = count(({ status }) => status === ProgressStatus.IMPROVING);
  const regressing = count(
    ({ status }) => status === ProgressStatus.REGRESSING,
  );
  const belowTarget = count(
    ({ band }) =>
      band === PerformanceBand.BELOW_TARGET ||
      band === PerformanceBand.NEEDS_WORK,
  );
  const missed = count(({ missed_latest }) => missed_latest);
  const unit = progression?.type.unit && unitLabel(progression.type.unit);

  return (
    <StatGroup>
      <Stat
        label={t('improving')}
        value={improving}
        unit={tStats('playerUnit')}
        color={improving > 0 ? 'green' : 'black'}
      />
      <Stat
        label={t('regressing')}
        value={regressing}
        unit={tStats('playerUnit')}
        color={regressing > 0 ? 'red' : 'black'}
      />
      <Stat
        label={t('belowTarget')}
        value={progression?.type.target == null ? '-' : belowTarget}
        unit={tStats('playerUnit')}
        color={belowTarget > 0 ? 'orange' : 'black'}
      />
      <Stat
        label={t('missedLatestTest')}
        value={missed}
        unit={tStats('playerUnit')}
        color={missed > 0 ? 'orange' : 'black'}
      />
      <Stat
        label={t('teamAverage')}
        value={
          progression?.team_average == null
            ? '-'
            : formatResult(progression.team_average)
        }
        unit={progression?.team_average == null ? undefined : unit}
      />
      <Stat
        label={t('teamBest')}
        value={
          progression?.team_best == null
            ? '-'
            : formatResult(progression.team_best)
        }
        unit={progression?.team_best == null ? undefined : unit}
      />
    </StatGroup>
  );
}
