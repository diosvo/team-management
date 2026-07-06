import Link from 'next/link';

import { Button, HStack } from '@chakra-ui/react';
import { Plus, Settings2 } from 'lucide-react';

import Authorized from '@/components/Authorized';
import PageTitle from '@/components/PageTitle';

export default function TestingHeader() {
  return (
    <HStack>
      <PageTitle title="Periodic Testing" />
      <Authorized resource="periodic-testing" action="create">
        <HStack marginLeft="auto">
          <Button size={{ base: 'sm', md: 'md' }} variant="surface" asChild>
            <Link href="/periodic-testing/test-types">
              <Settings2 size={14} />
              Manage Types
            </Link>
          </Button>
          <Button size={{ base: 'sm', md: 'md' }} asChild>
            <Link href="/periodic-testing/add-result">
              <Plus size={14} />
              Add Result
            </Link>
          </Button>
        </HStack>
      </Authorized>
    </HStack>
  );
}
