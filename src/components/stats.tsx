import { Heading, Icon, SimpleGrid, Text, VStack } from '@chakra-ui/react';
import { LucideIcon } from 'lucide-react';

export interface StatCard {
  label: string;
  icon: LucideIcon;
  colorScheme: string;
  value: string | number;
  suffix?: string;
}

interface StatGridProps {
  stats: StatCard[];
  columns?: { base: number; sm: number; md: number; lg: number };
}

export default function Stats({
  stats,
  columns = { base: 1, sm: 2, md: 2, lg: 4 },
}: StatGridProps) {
  return (
    <SimpleGrid columns={columns} gap={6} marginBlock={6}>
      {stats.map(
        ({ icon: IconComponent, value, label, colorScheme, suffix }) => (
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
              {typeof value === 'string' ? value : value}
              {suffix && (
                <Text fontSize="sm" color="gray.600">
                  {suffix}
                </Text>
              )}
            </Heading>
            <Text color="blackAlpha.700" fontSize="sm">
              {label}
            </Text>
          </VStack>
        )
      )}
    </SimpleGrid>
  );
}
