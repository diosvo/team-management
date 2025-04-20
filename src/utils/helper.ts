import { UserState } from './enum';

export function colorState(state: string): string {
  return state === UserState.ACTIVE
    ? 'green.500'
    : state === UserState.TEMPORARILY_ABSENT
    ? 'orange.500'
    : 'red.500';
}
