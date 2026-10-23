import Link from 'next/link';

import { Button } from '@chakra-ui/react';
import { Plus, Settings2 } from 'lucide-react';

import Authorized from '@/components/Authorized';
import PageHeader from '@/components/PageHeader';

export default function TestingHeader() {
  return (
    <PageHeader title="Periodic Testing">
      <Authorized resource="periodic-testing" action="create">
        <Button variant="surface" asChild>
          <Link href="/periodic-testing/test-types">
            <Settings2 size={14} />
            Manage Types
          </Link>
        </Button>
        <Button asChild>
          <Link href="/periodic-testing/add-result">
            <Plus size={14} />
            Add Result
          </Link>
        </Button>
      </Authorized>
    </PageHeader>
  );
}
