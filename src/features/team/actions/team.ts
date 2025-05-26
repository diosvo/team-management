'use server';

import { Team } from '@/drizzle/schema';
import { getTeam as getAction } from '../db/team';

export async function getTeam(): Promise<Nullish<Team>> {
  return await getAction();
}
