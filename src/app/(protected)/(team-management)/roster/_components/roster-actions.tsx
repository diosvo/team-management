'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useRef, useTransition } from 'react';

import {
  Button,
  CheckboxGroup,
  Grid,
  HStack,
  Input,
  InputGroup,
  Kbd,
  Popover,
  Portal,
  Spinner,
} from '@chakra-ui/react';
import { Filter, Search, UserRoundPlus } from 'lucide-react';

import { dialog } from '@/components/ui/dialog';
import Visibility from '@/components/visibility';

import { Checkbox } from '@/components/ui/checkbox';
import { FilterUsersSchema } from '@/features/user/schemas/user';
import { RolesSelection, StatesSelection } from '@/utils/constant';
import { zodResolver } from '@hookform/resolvers/zod';
import { useController, useForm } from 'react-hook-form';
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

  const {
    control,
    reset,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(FilterUsersSchema),
  });

  const roles = useController({
    control,
    name: 'roles',
    defaultValue: [],
  });
  const states = useController({
    control,
    name: 'state',
    defaultValue: [],
  });

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
        endElement={<Kbd size="sm">Enter</Kbd>}
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

      <Popover.Root lazyMount defaultOpen>
        <Popover.Trigger asChild>
          <Button variant="surface">
            <Filter />
            Filters
          </Button>
        </Popover.Trigger>
        <Portal>
          <Popover.Positioner>
            <Popover.Content>
              <Popover.Arrow />
              <Popover.Body>
                <form onSubmit={handleSubmit((data) => console.log(data))}>
                  <>
                    <Popover.Title fontWeight="medium" mb={2}>
                      State
                    </Popover.Title>
                    <CheckboxGroup
                      value={states.field.value}
                      onValueChange={states.field.onChange}
                      name={states.field.name}
                    >
                      {StatesSelection.map((item) => (
                        <Checkbox
                          key={item.value}
                          value={item.value}
                          variant="outline"
                          colorPalette="gray"
                        >
                          {item.label}
                        </Checkbox>
                      ))}
                    </CheckboxGroup>
                  </>
                  <>
                    <Popover.Title fontWeight="medium" mb={2} mt={4}>
                      Roles
                    </Popover.Title>
                    <CheckboxGroup
                      value={roles.field.value}
                      onValueChange={roles.field.onChange}
                      name={roles.field.name}
                    >
                      <Grid templateColumns="repeat(2, 1fr)" gap={2}>
                        {RolesSelection.map((item) => (
                          <Checkbox
                            key={item.value}
                            value={item.value}
                            variant="outline"
                            colorPalette="gray"
                          >
                            {item.label}
                          </Checkbox>
                        ))}
                      </Grid>
                    </CheckboxGroup>
                  </>
                </form>
              </Popover.Body>
              <Popover.Footer>
                <Button size="sm" type="submit">
                  Apply
                </Button>
              </Popover.Footer>
            </Popover.Content>
          </Popover.Positioner>
        </Portal>
      </Popover.Root>

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
