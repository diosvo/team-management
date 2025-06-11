'use server';

import { NullishTeam } from '@/drizzle/schema/team';
import { getTeam as getAction } from '../db/team';

export async function getTeam(): Promise<NullishTeam> {
  return await getAction();
}
