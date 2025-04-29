'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { use, useRef, useTransition } from 'react';

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
import { zodResolver } from '@hookform/resolvers/zod';
import { Filter, Search, UserRoundPlus } from 'lucide-react';
import { useController, useForm } from 'react-hook-form';

import { Checkbox } from '@/components/ui/checkbox';
import { dialog } from '@/components/ui/dialog';
import Visibility from '@/components/visibility';

import { useUser } from '@/hooks/use-user';
import { RolesSelection, StatesSelection } from '@/utils/constant';
import { UserRole } from '@/utils/enum';

import { FilterUsersSchema } from '@/features/user/schemas/user';
import AddUser from './add-user';

const Q_KEY = 'q' as const;

export default function RosterActions() {
  const searchParams = useSearchParams(); // Access the parameters of the current URL
  const pathname = usePathname(); // Read the current URL's pathname
  const { replace } = useRouter(); // Enable navigation between routes within client components programmatically

  const [isPending, startTransition] = useTransition();
  const dialogContentRef = useRef<HTMLDivElement>(null);

  const { userPromise } = useUser();
  const user = use(userPromise);

  const { control, reset, handleSubmit } = useForm({
    resolver: zodResolver(FilterUsersSchema),
  });
  const roles = useController({
    control,
    name: 'roles',
    defaultValue: [],
  });
  const state = useController({
    control,
    name: 'state',
    defaultValue: [],
  });

  const handleSearch = (term: string) => {
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
  };

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

      <Popover.Root lazyMount>
        <Popover.Trigger asChild>
          <Button variant="surface">
            <Filter />
            Filters
          </Button>
        </Popover.Trigger>
        <Portal>
          <Popover.Positioner>
            <Popover.Content width={{ base: '2xs' }}>
              <Popover.Arrow />
              <Popover.Body>
                <form onSubmit={handleSubmit((data) => console.log(data))}>
                  <>
                    <Popover.Title fontWeight="medium" mb={2}>
                      State
                    </Popover.Title>
                    <CheckboxGroup
                      name={state.field.name}
                      value={state.field.value}
                      onValueChange={state.field.onChange}
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
                      name={roles.field.name}
                      value={roles.field.value}
                      onValueChange={roles.field.onChange}
                    >
                      <Grid templateColumns="repeat(2, 1fr)" gap={2}>
                        {RolesSelection.map((item) => (
                          <Checkbox
                            key={item.value}
                            value={item.value}
                            variant="outline"
                            colorPalette="gray"
                            aria-label={item.label}
                          >
                            {item.label}
                          </Checkbox>
                        ))}
                      </Grid>
                    </CheckboxGroup>
                  </>
                </form>
                {/* <Code>
                  states: {JSON.stringify(states.field.value, null, 2)}
                </Code>
                <Code>roles: {JSON.stringify(roles.field.value, null, 2)}</Code> */}
              </Popover.Body>
              <Popover.Footer justifyContent="space-between">
                <Button
                  type="reset"
                  size="sm"
                  variant="outline"
                  colorPalette="red"
                  onClick={() => reset()}
                >
                  Reset
                </Button>
                <Button type="submit" size="sm">
                  Apply
                </Button>
              </Popover.Footer>
            </Popover.Content>
          </Popover.Positioner>
        </Portal>
      </Popover.Root>

      <Visibility isVisible={user!.roles.includes(UserRole.SUPER_ADMIN)}>
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
          Add
        </Button>
      </Visibility>
    </HStack>
  );
}
