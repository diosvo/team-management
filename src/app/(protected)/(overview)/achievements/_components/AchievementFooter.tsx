import { HStack, Separator, Span, Text, VStack } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';

export default function AchievementFooter() {
  const t = useTranslations('achievements.footer');

  return (
    <HStack gap={{ base: 4, md: 8 }}>
      <Separator flex={1} borderColor="gray.200" />
      <VStack gap={0} textAlign="center">
        <Text fontSize="sm">
          <Span>{t('lead')}</Span>
          <Span fontWeight="bold" color="primary" marginLeft={2}>
            {t('highlight')}
          </Span>
        </Text>
      </VStack>
      <Separator flex={1} borderColor="gray.200" />
    </HStack>
  );
}
