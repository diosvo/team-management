import { SelectableRole, SelectableState } from '@/utils/type';
import RosterMain from './_components/main';

export default async function RosterPage(
  props: Partial<{
    searchParams: Promise<{
      query: string;
      roles: string;
      state: string;
    }>;
  }>
) {
  const searchParams = await props.searchParams;
  const query = searchParams?.query || '';
  const roles = searchParams?.roles || '';
  const state = searchParams?.state || '';
  const rolesArray = roles
    ? roles.split(',').map((role) => role as SelectableRole)
    : [];
  const stateArray = state
    ? state.split(',').map((value) => value as SelectableState)
    : [];

  return (
    <RosterMain
      params={{
        query,
        roles: rolesArray,
        state: stateArray,
      }}
    />
  );
}
