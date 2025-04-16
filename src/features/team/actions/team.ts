'use server';

import { getTeam as getAction } from '../db/team';

export async function getTeam() {
  return await getAction();
}
