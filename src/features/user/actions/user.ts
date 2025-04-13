'use server';

import { getUsers } from '../db/user';

export async function getRoster() {
  return await getUsers();
}
