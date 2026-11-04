import { Badge, HStack, VStack } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';

import PageTitle from '@/components/PageTitle';

import { useSelection } from '@/i18n/enums';
import type { PerformanceIdentity } from '@/types/performance';
import { PLAYER_POSITIONS_SELECTION } from '@/utils/constants';
import { PlayerPosition } from '@/utils/enum';

import PerformanceFilters from './PerformanceFilters';

export default function PerformanceHeader({
  identity,
}: {
  identity: PerformanceIdentity;
}) {
  const t = useTranslations('performance');
  const positions = useSelection(PLAYER_POSITIONS_SELECTION, 'playerPosition');
  const position = positions.find(({ value }) => value === identity.position);
  const showPosition =
    identity.position != null && identity.position !== PlayerPosition.UNKNOWN;

  return (
    <HStack
      justifyContent="space-between"
      alignItems="start"
      flexWrap="wrap"
      gap={{ base: 3, lg: 4 }}
    >
      <VStack alignItems="start" gap={1}>
        <PageTitle
          title={identity.is_own ? t('page.ownTitle') : t('page.title')}
        />
        <HStack flexWrap="wrap" marginTop={4}>
          {identity.jersey_number != null && (
            <Badge variant="surface" borderRadius="full">
              #{identity.jersey_number}
            </Badge>
          )}
          {showPosition && (
            <Badge variant="outline" borderRadius="full">
              {position?.description ?? position?.label ?? identity.position}
            </Badge>
          )}
          {identity.is_captain && (
            <Badge variant="surface" borderRadius="full" colorPalette="yellow">
              {t('header.captain')}
            </Badge>
          )}
        </HStack>
      </VStack>

      {identity.is_player && <PerformanceFilters />}
    </HStack>
  );
}
