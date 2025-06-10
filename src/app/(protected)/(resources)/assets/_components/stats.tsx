import { Heading, Icon, SimpleGrid, Text, VStack } from '@chakra-ui/react';
import { AlertTriangle, Package } from 'lucide-react';
import { useMemo } from 'react';

export default function AssetStats({
  stats,
}: {
  stats: {
    total_items: number;
    need_replacement: number;
  };
}) {
  const statCards = useMemo(() => {
    return [
      {
        label: 'Total Items',
        icon: Package,
        colorScheme: 'gray',
        value: stats.total_items,
      },
      {
        label: 'Need Replacement',
        icon: AlertTriangle,
        colorScheme: 'red',
        value: stats.need_replacement,
      },
    ];
  }, [stats]);

  return (
    <SimpleGrid
      columns={{ base: 1, sm: 2, md: 2, lg: 4 }}
      gap={6}
      marginBlock={6}
    >
      {statCards.map(({ icon: IconComponent, value, label, colorScheme }) => (
        <VStack
          key={label}
          padding={4}
          borderWidth={1}
          borderRadius="lg"
          textAlign="center"
          borderColor={`${colorScheme}.300`}
          backgroundColor={`${colorScheme}.50`}
        >
          <Icon color={colorScheme} size="xl">
            <IconComponent />
          </Icon>
          <Heading size="2xl">{value}</Heading>
          <Text color="blackAlpha.700" fontSize="sm">
            {label}
          </Text>
        </VStack>
      ))}
    </SimpleGrid>
  );
}
