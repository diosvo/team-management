'use client';

import { HStack } from '@chakra-ui/react';

import SearchInput from '@/components/SearchInput';
import { RoleSelection } from '@/components/user/RolePositionSelection';
import { StateSelection } from '@/components/user/StateSelection';

import usePermissions from '@/hooks/use-permissions';
import { UserRole, UserState } from '@/utils/enum';
import { useRosterFilters } from '@/utils/filters';

import Visibility from '@/components/Visibility';
import AddUser from './AddUser';

export default function RosterFilters() {
  const { isAdmin, isCaptain } = usePermissions();
  const [{ state, role }, setSearchParams] = useRosterFilters();

  return (
    <HStack marginBlock={6}>
      <SearchInput />
      <StateSelection
        multiple
        width="2xs"
        value={state}
        onValueChange={({ value }) =>
          setSearchParams({ state: value as Array<UserState> })
        }
      />
      <Visibility isVisible={isAdmin || isCaptain}>
        <RoleSelection
          multiple
          width="2xs"
          value={role}
          onValueChange={({ value }) =>
            setSearchParams({ role: value as Array<UserRole> })
          }
        />
        <AddUser />
      </Visibility>
    </HStack>
  );
}
