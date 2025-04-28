'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useRef, useTransition } from 'react';

import {
  Button,
  HStack,
  Input,
  InputGroup,
  Kbd,
  Spinner,
} from '@chakra-ui/react';
import { Filter, Search, UserRoundPlus } from 'lucide-react';

import { dialog } from '@/components/ui/dialog';
import Visibility from '@/components/visibility';

import AddUser from './add-user';

const Q_KEY = 'q' as const;

function debounce(func: Function, wait: number = 0): Function {
  let timeoutID: ReturnType<typeof setTimeout> | null = null;

  return function (this: any, ...args: any[]) {
    // Keep a reference to `this` so that
    // func.apply() can access it.
    const context = this;
    clearTimeout(timeoutID ?? undefined);

    timeoutID = setTimeout(function () {
      timeoutID = null; // Not strictly necessary but good to do this.
      func.apply(context, args);
    }, wait);
  };
}

export default function RosterActions() {
  // Allow to access the parameters of the current URL
  const searchParams = useSearchParams();
  // Read the current URL's pathname
  const pathname = usePathname();
  // Enable navigation between routes within client components programmatically
  const { replace } = useRouter();

  const [isPending, startTransition] = useTransition();
  const dialogContentRef = useRef<HTMLDivElement>(null);

  const handleSearch = debounce((term: string) => {
    console.log(`Searching... ${term}`);

    const params = new URLSearchParams(searchParams);
    if (term) {
      params.set(Q_KEY, term);
    } else {
      params.delete(Q_KEY);
    }

    startTransition(() => {
      replace(`${pathname}?${params.toString()}`);
    });
  }, 300);

  return (
    <HStack marginBlock={6}>
      <InputGroup
        flex="1"
        startElement={
          isPending ? (
            <Spinner size="xs" colorPalette="gray" borderWidth="1px" />
          ) : (
            <Search size={14} />
          )
        }
        endElement={
          <Kbd size="sm" variant="outline">
            Enter
          </Kbd>
        }
      >
        <Input
          borderWidth="1px"
          placeholder="Search..."
          css={{ '--focus-color': 'colors.red.300' }}
          defaultValue={searchParams.get(Q_KEY)?.toString()}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleSearch(e.currentTarget.value);
            }
          }}
        />
      </InputGroup>
      <Button variant="surface" disabled>
        <Filter />
        Filters
      </Button>
      <Visibility isVisible={true}>
        <Button
          onClick={() =>
            dialog.open('add-user', {
              contentRef: dialogContentRef,
              children: (
                <AddUser
                  users={[]}
                  currentMail={'vtmn1212@gmail.com'}
                  containerRef={dialogContentRef}
                />
              ),
            })
          }
        >
          <UserRoundPlus />
          Add User
        </Button>
      </Visibility>
    </HStack>
  );
}
