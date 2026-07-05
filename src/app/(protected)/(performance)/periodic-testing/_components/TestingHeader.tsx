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
            <a href="/periodic-testing/test-types">
              <Settings2 size={14} />
              Manage Types
            </a>
          </Button>
          <Button size={{ base: 'sm', md: 'md' }} asChild>
            <a href="/periodic-testing/add-result">
              <Plus size={14} />
              Add Result
            </a>
          </Button>
        </HStack>
      </Authorized>
    </HStack>
  );
}
