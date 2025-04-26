import { UserState } from './enum';

export function colorState(state: string): string {
  return state === UserState.ACTIVE
    ? 'green'
    : state === UserState.TEMPORARILY_ABSENT
    ? 'orange'
    : state === UserState.INACTIVE
    ? 'red'
    : 'gray';
}
