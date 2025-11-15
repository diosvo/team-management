'use client';

import { HStack } from '@chakra-ui/react';

import SearchInput from '@/components/SearchInput';
import { RoleSelection } from '@/components/user/RolePositionSelection';
import { StateSelection } from '@/components/user/StateSelection';
import Visibility from '@/components/visibility';

import { usePermissions } from '@/hooks/use-permissions';

import { useRosterFilters } from '../search-params';
import AddUser from './AddUser';

export default function RosterFilters() {
  const { isAdmin } = usePermissions();
  const [{ state, role }, setSearchParams] = useRosterFilters();

  return (
    <HStack marginBlock={6}>
      <SearchInput />
      <StateSelection
        multiple
        width="2xs"
        value={state}
        onValueChange={({ value }) => setSearchParams({ state: value })}
      />
      <Visibility isVisible={isAdmin}>
        <RoleSelection
          multiple
          width="2xs"
          value={role}
          onValueChange={({ value }) => setSearchParams({ role: value })}
        />
        <AddUser />
      </Visibility>
    </HStack>
  );
}
