'use client';

import { useMemo } from 'react';

import {
  Badge,
  Heading,
  Icon,
  SimpleGrid,
  Text,
  VStack,
} from '@chakra-ui/react';
import { Activity, Target, TrendingUp, Users } from 'lucide-react';

interface TestingStatsProps {
  stats: {
    total_players: number;
    completed_tests: number;
    average_score: number;
    improvement_rate: number;
    pending_tests: number;
    overdue_tests: number;
    top_performers: number;
    next_test_in_days: number;
  };
}

export default function TestingStats({ stats }: TestingStatsProps) {
  const statCards = useMemo(() => {
    return [
      {
        label: 'Total Players',
        icon: Users,
        colorScheme: 'blue',
        value: stats.total_players,
        suffix: '',
      },
      {
        label: 'Average Score',
        icon: Target,
        colorScheme: 'purple',
        value: stats.average_score,
        suffix: '%',
      },
      {
        label: 'Improvement Rate',
        icon: TrendingUp,
        colorScheme: stats.improvement_rate >= 0 ? 'green' : 'red',
        value: Math.abs(stats.improvement_rate),
        suffix: '%',
        prefix: stats.improvement_rate >= 0 ? '+' : '-',
      },
      {
        label: 'Next Test In',
        icon: Activity,
        colorScheme: 'cyan',
        value: stats.next_test_in_days,
        suffix: stats.next_test_in_days === 1 ? ' day' : ' days',
      },
    ];
  }, [stats]);

  return (
    <SimpleGrid
      columns={{ base: 1, sm: 2, md: 2, lg: 4 }}
      gap={6}
      marginBlock={6}
    >
      {statCards.map(
        ({
          icon: IconComponent,
          value,
          label,
          colorScheme,
          suffix,
          prefix,
        }) => (
          <VStack
            key={label}
            padding={4}
            borderWidth={1}
            borderRadius="lg"
            textAlign="center"
            borderColor={`${colorScheme}.300`}
            backgroundColor={`${colorScheme}.50`}
            position="relative"
            _hover={{
              shadow: 'md',
              transform: 'translateY(-2px)',
              transition: 'all 0.2s',
            }}
          >
            <Icon color={colorScheme} size="xl">
              <IconComponent />
            </Icon>
            <Heading size="2xl" display="flex" alignItems="baseline" gap={1}>
              {prefix && <Text fontSize="lg">{prefix}</Text>}
              {value}
              {suffix && (
                <Text fontSize="sm" color="gray.600">
                  {suffix}
                </Text>
              )}
            </Heading>
            <Text color="blackAlpha.700" fontSize="sm">
              {label}
            </Text>

            {/* Status badge for specific metrics */}
            {label === 'Improvement Rate' && (
              <Badge
                position="absolute"
                top={2}
                right={2}
                colorPalette={stats.improvement_rate >= 0 ? 'green' : 'red'}
                variant="surface"
                size="sm"
              >
                {stats.improvement_rate >= 0 ? 'Improving' : 'Declining'}
              </Badge>
            )}

            {label === 'Overdue Tests' && stats.overdue_tests > 0 && (
              <Badge
                position="absolute"
                top={2}
                right={2}
                colorPalette="red"
                variant="solid"
                size="sm"
              >
                Urgent
              </Badge>
            )}
          </VStack>
        )
      )}
    </SimpleGrid>
  );
}
