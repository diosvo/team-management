import { EmptyState, VStack } from '@chakra-ui/react';
import { UserX } from 'lucide-react';

export default function NotFound() {
  return (
    <EmptyState.Root borderWidth={1} borderRadius="md">
      <EmptyState.Content>
        <EmptyState.Indicator>
          <UserX />
        </EmptyState.Indicator>
        <VStack textAlign="center">
          <EmptyState.Title>User not found</EmptyState.Title>
          <EmptyState.Description>
            The profile you are looking for does not exist or has been removed.
          </EmptyState.Description>
        </VStack>
      </EmptyState.Content>
    </EmptyState.Root>
  );
}
