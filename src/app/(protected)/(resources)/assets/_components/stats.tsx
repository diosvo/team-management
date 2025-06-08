import { Heading, Icon, SimpleGrid, Text, VStack } from '@chakra-ui/react';
import { AlertTriangle, Package } from 'lucide-react';

interface AssetStatsProps {
  stats: {
    total_items: number;
    need_replacement: number;
  };
}

export default function AssetStats({ stats }: AssetStatsProps) {
  return (
    <SimpleGrid
      columns={{ base: 1, sm: 2, md: 2, lg: 4 }}
      gap={6}
      marginBlock={6}
    >
      <VStack
        backgroundColor="gray.50"
        borderColor="gray.300"
        borderWidth={1}
        rounded="lg"
        padding={4}
        textAlign="center"
      >
        <Icon color="gray" size="xl">
          <Package />
        </Icon>
        <Heading size="2xl">{stats.total_items}</Heading>
        <Text color="blackAlpha.700" fontSize="sm">
          Total Items
        </Text>
      </VStack>
      <VStack
        backgroundColor="red.50"
        borderWidth={1}
        borderColor="red.300"
        rounded="lg"
        padding={4}
        textAlign="center"
      >
        <Icon color="red" size="xl">
          <AlertTriangle />
        </Icon>
        <Heading size="2xl">{stats.need_replacement}</Heading>
        <Text color="blackAlpha.700" fontSize="sm">
          Need Replacement
        </Text>
      </VStack>
    </SimpleGrid>
  );
}
