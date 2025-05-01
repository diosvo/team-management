'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useRef, useTransition } from 'react';

import { Button, Heading, HStack, VStack } from '@chakra-ui/react';
import { UserRoundPlus } from 'lucide-react';

import SearchBar from '@/components/search-bar';
import { dialog } from '@/components/ui/dialog';
import Visibility from '@/components/visibility';

import { usePermissions } from '@/hooks/use-permissions';

import AddUser from './add-user';
import SelectionFilter from './selection-filter';

export default function RosterActions({
  emailExists,
}: {
  emailExists: Array<string>;
}) {
  const isAdmin = usePermissions();

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const dialogContentRef = useRef<HTMLDivElement>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <VStack align="stretch">
      <HStack alignItems="center">
        <Heading as="h1" size="xl" marginRight="auto">
          Team Roster
        </Heading>
        <Button
          variant="plain"
          textDecoration="underline"
          _hover={{ color: 'tomato' }}
          disabled={!searchParams.toString() || isPending}
          onClick={() => {
            startTransition(() => {
              router.replace(pathname);
            });
          }}
        >
          Clear all search
        </Button>
      </HStack>

      <HStack marginBlock={2}>
        <SearchBar isLoading={isPending} />
        <SelectionFilter />
        <Visibility isVisible={isAdmin}>
          <Button
            onClick={() =>
              dialog.open('add-user', {
                contentRef: dialogContentRef,
                children: (
                  <AddUser
                    emailExists={emailExists}
                    containerRef={dialogContentRef}
                  />
                ),
              })
            }
          >
            <UserRoundPlus />
            Add
          </Button>
        </Visibility>
      </HStack>
    </VStack>
  );
}
