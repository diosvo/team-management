import { DEFAULT_LOGIN_REDIRECT } from '@/routes';
import { Button, Center, Heading, Text, VStack } from '@chakra-ui/react';
import { LockKeyhole } from 'lucide-react';
import Link from 'next/link';

export default function Forbidden() {
  return (
    <Center h="100vh">
      <VStack gap={6} align="center" textAlign="center">
        <LockKeyhole size={48} color="red" />

        <VStack>
          <Heading size="2xl">Access Denied</Heading>
          <Text fontSize="lg">
            You are not authorized to access this resource.
          </Text>
        </VStack>

        <Button variant="subtle" asChild>
          <Link href={DEFAULT_LOGIN_REDIRECT}>Return Dashboard</Link>
        </Button>
      </VStack>
    </Center>
  );
}
