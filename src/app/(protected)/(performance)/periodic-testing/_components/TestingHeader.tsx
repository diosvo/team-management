import Link from 'next/link';

import { Button, HStack, Menu, Portal } from '@chakra-ui/react';
import { ChartNoAxesGantt, Plus, Settings2 } from 'lucide-react';

import Authorized from '@/components/Authorized';
import PageTitle from '@/components/PageTitle';

export default function TestingHeader() {
  return (
    <HStack justifyContent="space-between">
      <PageTitle title="Periodic Testing" />
      <Authorized resource="periodic-testing" action="create">
        <Menu.Root>
          <Menu.Trigger asChild>
            <Button size={{ base: 'sm', md: 'md' }}>
              <ChartNoAxesGantt />
              Actions
            </Button>
          </Menu.Trigger>
          <Portal>
            <Menu.Positioner>
              <Menu.Content>
                <Menu.Item value="add-test-result" asChild>
                  <Link href="/periodic-testing/add-result">
                    <Plus size={14} />
                    Add Result
                  </Link>
                </Menu.Item>
                <Menu.Item value="test-types" asChild>
                  <Link href="/periodic-testing/test-types">
                    <Settings2 size={14} />
                    Manage Test Types
                  </Link>
                </Menu.Item>
              </Menu.Content>
            </Menu.Positioner>
          </Portal>
        </Menu.Root>
      </Authorized>
    </HStack>
  );
}
