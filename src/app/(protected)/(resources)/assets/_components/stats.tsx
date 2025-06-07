import { Heading, Icon, SimpleGrid, Text, VStack } from '@chakra-ui/react';
import { AlertTriangle, Package } from 'lucide-react';

const stats = [
  {
    label: 'Total Items',
    value: 81,
    icon: Package,
    color: 'gray',
  },
  {
    label: 'Need Replacement',
    value: 1,
    icon: AlertTriangle,
    color: 'red',
  },
];

export default function AssetStats() {
  return (
    <SimpleGrid
      columns={{ base: 1, sm: 2, md: 2, lg: 4 }}
      gap={6}
      marginBlock={6}
    >
      {stats.map((stat) => {
        const StatIcon = stat.icon;
        return (
          <VStack
            backgroundColor={stat.color + '.50'}
            key={stat.label}
            borderWidth={1}
            rounded="lg"
            padding={4}
            textAlign="center"
          >
            <Icon color={stat.color} size="xl">
              <StatIcon />
            </Icon>
            <Heading size="2xl">{stat.value}</Heading>
            <Text color="GrayText" fontSize="sm">
              {stat.label}
            </Text>
          </VStack>
        );
      })}
    </SimpleGrid>
  );
}
