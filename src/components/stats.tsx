import {
  ColorPalette,
  Heading,
  Icon,
  SimpleGrid,
  Text,
  VStack,
} from '@chakra-ui/react';
import { LucideIcon } from 'lucide-react';

export interface StatCard {
  label: string;
  icon: LucideIcon;
  color: ColorPalette;
  value: string | number;
  suffix?: string;
}

export default function Stats({ stats }: { stats: Array<StatCard> }) {
  return (
    <SimpleGrid
      columns={{ base: 1, sm: 2, md: 2, lg: 4 }}
      gap={6}
      marginBlock={6}
    >
      {stats.map(({ icon: IconComponent, value, label, color, suffix }) => (
        <VStack
          key={label}
          padding={4}
          borderWidth={1}
          borderRadius="lg"
          textAlign="center"
          borderColor={`${color}.300`}
          backgroundColor={`${color}.50`}
          position="relative"
          _hover={{
            shadow: 'md',
            transform: 'translateY(-2px)',
            transition: 'all 0.2s',
          }}
        >
          <Icon color={color} size="xl">
            <IconComponent />
          </Icon>
          <Heading size="2xl" display="flex" alignItems="baseline" gap={1}>
            {typeof value === 'string' ? value : value}
            {suffix && (
              <Text fontSize="sm" color="gray.600">
                {typeof value === 'string'
                  ? suffix
                  : value < 2
                  ? `${suffix}`
                  : `${suffix}s`}
              </Text>
            )}
          </Heading>
          <Text color="blackAlpha.700" fontSize="sm">
            {label}
          </Text>
        </VStack>
      ))}
    </SimpleGrid>
  );
}
