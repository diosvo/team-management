'use client';

import NextLink from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import {
  Badge,
  Box,
  Button,
  Flex,
  Heading,
  Span,
  Text,
  VStack,
  Wrap,
} from '@chakra-ui/react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { ArrowRight, Crown, Eye } from 'lucide-react';

import { UserRole } from '@/utils/enum';
import { getColor } from '@/utils/helper';

import { Card } from '@/components/ui/card';
import type { User } from '@/drizzle/schema';
import usePermissions from '@/hooks/use-permissions';
import { enumFullLabel, enumLabel } from '@/i18n/enums';
import { useSessionContext } from '@/providers/session';

import AvatarUploader from './AvatarUploader';

import { positionLabel } from '../_helpers/position';

export default function ProfileHeader({
  user,
  viewOnly,
}: {
  user: User;
  viewOnly: boolean;
}) {
  const t = useTranslations('profile');
  const tEnums = useTranslations('enums');
  const locale = useLocale();
  const { user: viewer } = useSessionContext();
  const { isAdmin } = usePermissions();

  const isPlayer = user.role === UserRole.PLAYER;
  const position = positionLabel(tEnums, user, enumFullLabel);
  const jersey = isPlayer ? user.player?.jersey_number : null;
  const hasJersey = typeof jersey === 'number';
  // The performance page is open to admins and to the player themselves.
  const canViewPerformance = isPlayer && (isAdmin || viewer?.id === user.id);

  return (
    <Card title={null}>
      <Flex
        wrap={{ base: 'wrap', md: 'nowrap' }}
        alignItems="center"
        columnGap={{ base: 4, md: 6 }}
        rowGap={4}
      >
        <Box flexShrink={0}>
          <AvatarUploader user={user} />
        </Box>

        <VStack
          flex={1}
          minWidth={0}
          gap={{ base: 2, md: 3 }}
          alignItems="start"
        >
          <Wrap align="center" gap={2}>
            <Heading
              as="h2"
              size={{ base: 'lg', md: '2xl' }}
              overflowWrap="anywhere"
            >
              {user.name}
            </Heading>
            {user.player?.is_captain && (
              <Badge colorPalette="yellow" variant="surface">
                <Crown size={12} />
                {t('header.captain')}
              </Badge>
            )}
            {viewOnly && (
              <Badge variant="outline">
                <Eye size={12} />
                {t('viewOnly')}
              </Badge>
            )}
          </Wrap>

          <Wrap gap={2}>
            <Badge variant="outline" borderRadius="full">
              {enumLabel(tEnums, 'userRole', user.role)}
            </Badge>
            {position && (
              <Badge variant="outline" borderRadius="full">
                {position}
              </Badge>
            )}
            <Badge
              variant="surface"
              borderRadius="full"
              colorPalette={getColor(user.state)}
            >
              {enumLabel(tEnums, 'userState', user.state)}
            </Badge>
            {hasJersey && (
              <Badge variant="solid" borderRadius="full" hideFrom="md">
                #{jersey}
              </Badge>
            )}
          </Wrap>

          {user.join_date && (
            <Text textStyle={{ base: 'xs', md: 'sm' }} color="fg.muted">
              {t('header.memberFor', {
                duration: formatDistanceToNow(user.join_date, {
                  locale: locale === 'vi' ? vi : undefined,
                }),
              })}
            </Text>
          )}
        </VStack>

        {(hasJersey || canViewPerformance) && (
          <VStack
            display={{ base: canViewPerformance ? 'flex' : 'none', md: 'flex' }}
            flexBasis={{ base: 'full', md: 'auto' }}
            flexShrink={0}
            gap={3}
            alignItems={{ base: 'stretch', md: 'end' }}
          >
            {hasJersey && (
              <VStack hideBelow="md" gap={1} alignItems="end">
                <Text textStyle="xs" color="fg.muted">
                  {t('team.jerseyNumber')}
                </Text>
                <Text fontSize="5xl" lineHeight={1}>
                  <Span color="fg.subtle">#</Span>
                  <Span color="red.500" fontWeight="bold">
                    {jersey}
                  </Span>
                </Text>
              </VStack>
            )}
            {canViewPerformance && (
              <Button size="sm" variant="outline" asChild>
                <NextLink href={`/performance/${user.id}`}>
                  {t('header.viewPerformance')}
                  <ArrowRight />
                </NextLink>
              </Button>
            )}
          </VStack>
        )}
      </Flex>
    </Card>
  );
}
